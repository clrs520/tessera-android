package com.tdashcam.studio

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.tdashcam.studio.export.ExportEngine
import org.json.JSONObject
import java.util.concurrent.CopyOnWriteArrayList

/**
 * The export job, and everything the page can ask about it.
 *
 * This lives outside the activity on purpose. An encode of six streams takes minutes, and the page
 * that asked for it is a WebView inside an activity the system is free to stop, hide or, under memory
 * pressure, throw away — the old build cancelled the job in `onDestroy`, so a phone in a pocket
 * produced nothing. The engine here belongs to the process, [ExportService] keeps the process worth
 * enough memory to keep, and the page reconnects through [statusJson] instead of having to be there.
 */
object ExportHost {
    private val engine = ExportEngine()
    private val observers = CopyOnWriteArrayList<(String) -> Unit>()

    /** The newest payload, so a page that was not alive when the job started can pick up the story. */
    @Volatile
    var latest: String? = null
        private set

    /** Whether the page has already been shown the terminal payload. It owns the toast, the haptic
     * and the media scan, and none of them may run twice. */
    @Volatile
    var delivered = true
        private set

    /** Wording supplied by the page: the notification has to speak the language the user tapped in,
     * and Kotlin has no dictionary of its own. */
    @Volatile
    var labels: JSONObject = JSONObject()
        private set

    /** R206 — the id the page minted for the job it just asked the service to start, so a service
     * that cannot even get its notification up can refuse *that* job by name. */
    @Volatile
    private var pendingId = -1L

    fun label(key: String, fallback: String): String = labels.optString(key).ifEmpty { fallback }

    fun addObserver(observer: (String) -> Unit) = observers.addIfAbsent(observer)

    fun removeObserver(observer: (String) -> Unit) = observers.remove(observer)

    fun isBusy(): Boolean = engine.isBusy()

    fun codecReport(width: Int, height: Int): String = engine.describeCodecs(width, height)

    fun codecProbe(): String = engine.probeCodecs()

    fun cancel(id: Long) = engine.cancel(id)

    /**
     * Hand the job to the service and answer straight away with the id the page minted: a
     * `@JavascriptInterface` call has to return synchronously, and the progress arrives later.
     *
     * @return the id, or -1 when the request is unreadable or a job is already running. A refusal is
     *   also published as an `error` payload so the page sees one story either way.
     */
    fun submit(context: Context, requestJson: String): Long {
        val root = runCatching { JSONObject(requestJson) }.getOrNull()
            ?: return -1
        val id = root.optLong("id", -1L)
        if (id < 0) return -1
        labels = root.optJSONObject("labels") ?: JSONObject()
        if (engine.isBusy()) {
            // R85: a refusal is not a job's progress. It still has to reach the page, but it must not
            // become the state a later re-attach reads back as 「the running job」 — this id was never
            // started, and a page that adopts it filters the *real* job's payloads forever.
            publishRefusal(errorPayload(id, "busy", label("busy", "已有一个导出任务在运行")))
            return -1
        }
        val intent = Intent(context, ExportService::class.java).putExtra(ExportService.EXTRA_REQUEST, requestJson)
        pendingId = id
        val started = runCatching { ContextCompat.startForegroundService(context, intent) }.isSuccess
        if (!started) {
            pendingId = -1L
            publishRefusal(errorPayload(id, "startFailed", label("startFailed", "后台任务起不来，请重试")))
        }
        return if (started) id else -1
    }

    /**
     * Called by the service once it is in the foreground, so nothing encodes without a promise.
     *
     * The engine's own refusal for an unparseable request is addressed to id 0 — `Request.parse`
     * threw before it learned the id — and a page that only listens for its own job would ignore
     * it, leaving an export that never started looking like one that is still running. The id is
     * known here, so the refusal is re-addressed on the way out.
     */
    internal fun run(requestJson: String): Long {
        val id = runCatching { JSONObject(requestJson).optLong("id", 0L) }.getOrDefault(0L)
        // The job is the engine's now, with its own failure payloads addressed to its own id.
        pendingId = -1L
        return engine.start(requestJson) { payload ->
            publish(runCatching {
                val json = JSONObject(payload)
                if (id > 0L && json.optLong("id") == 0L && json.optString("phase") == "error") {
                    json.put("id", id).toString()
                } else {
                    payload
                }
            }.getOrDefault(payload))
        }
    }

    internal fun publish(payload: String) {
        val json = runCatching { JSONObject(payload) }.getOrNull()
        val id = json?.optLong("id") ?: 0L
        val runningId = engine.runningId()
        // R151: an engine-level refusal (unreadable request, "already busy") reaches this path with
        // the id of a request that never started. Storing it in `latest` while another job encodes
        // made a re-attach read the refusal as the running job's own state and drop its story.
        // While a job runs, only that job's id is a state; everything else is a refusal and only
        // goes to the observers. A terminal payload arrives after the engine clears `running`
        // (runningId 0), so it still lands in `latest`.
        if (runningId > 0L && id != runningId) {
            observers.forEach { runCatching { it(payload) } }
            return
        }
        latest = payload
        val phase = json?.optString("phase").orEmpty()
        if (phase == "done" || phase == "cancelled" || phase == "error") delivered = false
        // The page's observer and the service's are independent: one throwing must not silence the
        // other, or a broken WebView would leave a finished export with no notification.
        observers.forEach { runCatching { it(payload) } }
    }

    /**
     * R85: a refusal reaches the page the same way progress does, but it is not a job's state — the
     * id it names was never started. Storing it in `latest` made the next re-attach adopt that id, and
     * the page then filtered the *real* job's progress and its terminal payload forever (pill stuck at
     * 「导出中 0%」, 「开始导出」 disabled, finished file with no toast and no media scan).
     */
    internal fun publishRefusal(payload: String) {
        observers.forEach { runCatching { it(payload) } }
    }

    fun markDelivered() {
        delivered = true
    }

    /**
     * R206 — the promise the service could not make. `submit()` already knows which job asked for it,
     * so the refusal is addressed to that id and reaches the page as the same terminal payload any
     * other failure would; the fallback wording is only for a language dictionary that predates the
     * code.
     */
    fun reportStartFailure(code: String, message: String) {
        val id = pendingId
        if (id <= 0L) return
        publishRefusal(errorPayload(id, code, message))
    }

    fun statusJson(): String {
        val status = JSONObject()
        status.put("running", engine.isBusy())
        status.put("delivered", delivered)
        // The payload is kept as the string the engine wrote rather than re-serialised: the page
        // parses exactly what a live progress report would have handed it, so re-attach cannot
        // differ from being there.
        val raw = latest
        if (raw != null) {
            runCatching { JSONObject(raw) }.getOrNull()?.let { status.put("payload", it) }
        }
        return status.toString()
    }

    /**
     * A refusal from the service, not from the engine. `code` is the same vocabulary the engine
     * speaks (`peEngine_*`), so the page puts the words on and switching language later still
     * works — the `message` here is only the fallback for a code this build does not know.
     */
    private fun errorPayload(id: Long, code: String, message: String) = JSONObject().apply {
        put("id", id)
        put("phase", "error")
        put("percent", 0)
        put("code", code)
        put("message", message)
    }.toString()
}

/**
 * The promise that keeps an export alive: a foreground service, its notification, and a wake lock.
 *
 * Three separate systems try to stop a minute-long encode, and this handles all three. The battery
 * optimiser freezes a backgrounded process (a foreground service is exempt, an ordinary one is not);
 * the CPU itself suspends when the screen goes off, which is why the partial wake lock is here and
 * the screen is not kept on; and on Android 12+ a process with no eligible service is denied
 * hardware codec resources, which is the `dataSync` type rather than decoration.
 */
class ExportService : Service() {
    companion object {
        const val EXTRA_REQUEST = "request"
        const val ACTION_CANCEL = "com.tdashcam.studio.action.EXPORT_CANCEL"
        private const val CHANNEL_ID = "export"

        // The progress bar and the verdict cannot share a channel. A batch of frames hands over
        // roughly three times a second, so the bar has to be silent and badge-free; but a job that
        // finishes while the phone is in a pocket is worth an interruption, and a LOW channel buries
        // its result under 静音 where nobody looks. Two channels, because importance is per channel.
        private const val RESULT_CHANNEL_ID = "export-result"
        private const val NOTIFICATION_ID = 4242

        // A different id, not just a different channel: Android keeps a live notification on the
        // channel it first arrived with, so re-posting 4242 on the result channel would stay silent.
        private const val RESULT_NOTIFICATION_ID = 4243
        private const val WAKE_LOCK_TAG = "tessera:export"
        private const val TAG = "ExportService"

        // Long enough for any honest export, short enough that a service which dies without
        // releasing cannot leave the SoC awake indefinitely.
        private const val WAKE_LOCK_TIMEOUT_MS = 6L * 60L * 60L * 1000L
    }

    private var lastRequest: String? = null
    private var wakeLock: PowerManager.WakeLock? = null
    // Whether this instance ever got its foreground promise. `onStartCommand` still runs after a
    // refused `onCreate`, and an encode without a promise is the thing being prevented.
    private var promised = false
    private val mainHandler = Handler(Looper.getMainLooper())
    private val observer: (String) -> Unit = { payload -> render(payload) }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createChannel()
        // Inside the ten-second window the system gives a started foreground service, and before
        // any decoding starts: a notification that says 「准备导出…」 for a frame is honest, while
        // an invisible job that has not been promised yet is exactly the failure being fixed.
        //
        // R206: `startForeground` is allowed to throw — a dataSync quota exhausted for the day on
        // Android 14+, a ROM that refuses the type, a task already removed. Left bare, that throw
        // happened in `onCreate` and took the whole process with it: the page, the WebView, the
        // scan that was running. So the promise is asked for, and refused, in the open — and no
        // frame is decoded without it.
        if (!promote(buildProgress(ExportHost.label("preparing", "准备导出…"), 0))) {
            // 同一个用户可见的结局（后台任务起不来），所以用页面里已有那句话，不新增一个只有 Kotlin
            // 认识的码 —— 没有译文的码会在 toast 上漏出英文原文。
            ExportHost.reportStartFailure("startFailed", ExportHost.label("startFailed", "后台导出任务起不来，请重试"))
            stopSelf()
            return
        }
        promised = true
        ExportHost.addObserver(observer)
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!promised) return START_NOT_STICKY
        if (intent?.action == ACTION_CANCEL) {
            // The notification's own button: it may arrive after the page stopped listening, which
            // is the entire reason the action is a service intent rather than a JS call.
            ExportHost.cancel(0)
            // `cancel(0)` only knows how to stop a *running* job. Tapped in the instant between the
            // engine clearing `running` and `render()` stopping the service — or delivered late by
            // the system — it is a no-op, and without this line the service stayed in the foreground
            // with a 「准备导出… 0%」 notification and a six-hour wake lock behind an idle engine.
            if (!ExportHost.isBusy()) stopSelf()
            return START_NOT_STICKY
        }
        val request = intent?.getStringExtra(EXTRA_REQUEST)
        if (request != null && request != lastRequest) {
            lastRequest = request
            // R85: `run()` returns -1 for a refusal too, and one refusal reason is "a job is already
            // running" — a late or duplicate intent for the same request. Stopping here would tear the
            // foreground service out from under the encode that IS running: no wake lock, screen-off
            // suspends the CPU, and on Android 12+ a process whose eligible service just stopped can
            // have codec access revoked mid-file. Same guard as the idle branch below.
            if (ExportHost.run(request) < 0 && !ExportHost.isBusy()) stopSelf()
            return START_NOT_STICKY
        }
        // Started with nothing to do: a task-restore, or a second tap whose request the host already
        // refused. There is no job to report on, so there is no reason to hold the process up.
        if (!ExportHost.isBusy()) stopSelf()
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        ExportHost.removeObserver(observer)
        // R206: 前台身份没了，编码就不该继续。系统停服务（配额、用户手停、内存压力）之后这个进程
        // 随时可能被杀，而半截的 mp4 没有 moov —— 相册里就是一个 0 秒、点开报错的文件。取消会让引擎
        // 自己收尾：写出过帧的按「已写入的片段保存在文件里」留着，一段没写的删掉。
        if (ExportHost.isBusy()) ExportHost.cancel(0)
        runCatching { wakeLock?.takeIf { it.isHeld }?.release() }
        wakeLock = null
        super.onDestroy()
    }

    /** Runs on the engine's worker thread; only the service control calls have to hop. */
    private fun render(payload: String) {
        val json = runCatching { JSONObject(payload) }.getOrNull() ?: return
        val phase = json.optString("phase")
        val terminal = phase == "done" || phase == "cancelled" || phase == "error"
        val notification = if (terminal) {
            buildTerminal(json, phase)
        } else {
            buildProgress(json.optString("message"), json.optInt("percent"))
        }
        // Denying POST_NOTIFICATIONS does not throw and does not stop the job: the user simply has no
        // progress outside the app, which the page has already been told.
        if (terminal) {
            runCatching { NotificationManagerCompat.from(this).notify(RESULT_NOTIFICATION_ID, notification) }
            mainHandler.post {
                // The engine clears `running` a moment before it publishes the verdict, so a job
                // submitted in that gap lands on this same live instance. Stopping here would leave
                // the new encode running with no foreground promise and no bar, and the page would
                // sit at 0 % forever — which is the whole reason this line is a condition.
                if (!ExportHost.isBusy()) {
                    // Remove, do not detach. The row worth keeping is the one that can alert, on the
                    // result channel; a 「正在导出 · 100%」 still hanging around next to the verdict is
                    // a lie, and the service is about to go away with it.
                    runCatching { stopForeground(STOP_FOREGROUND_REMOVE) }
                    stopSelf()
                }
            }
        } else {
            runCatching { NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notification) }
        }
    }

    private fun acquireWakeLock() {
        val manager = getSystemService(POWER_SERVICE) as? PowerManager ?: return
        val lock = manager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG)
        runCatching {
            lock.setReferenceCounted(false)
            lock.acquire(WAKE_LOCK_TIMEOUT_MS)
        }
        wakeLock = lock.takeIf { it.isHeld }
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NOTIFICATION_SERVICE) as? NotificationManager ?: return
        // Low, and no badge: a batch of frames hands over roughly three times a second, and each
        // one updating a ringing notification would be worse than no notification at all.
        val channel = NotificationChannel(CHANNEL_ID, ExportHost.label("channel", "导出"), NotificationManager.IMPORTANCE_LOW)
        channel.setShowBadge(false)
        manager.createNotificationChannel(channel)
        // Default is the quietest importance that still heads up and makes a sound.
        manager.createNotificationChannel(
            NotificationChannel(
                RESULT_CHANNEL_ID,
                ExportHost.label("resultChannel", "导出结果"),
                NotificationManager.IMPORTANCE_DEFAULT
            )
        )
    }

    private fun promote(notification: Notification): Boolean = runCatching {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
        true
    }.getOrElse {
        Log.w(TAG, "startForeground refused", it)
        false
    }

    private fun buildProgress(message: String, percent: Int): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_export)
            .setContentTitle("${ExportHost.label("running", "正在导出")} · $percent%")
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setProgress(100, percent.coerceIn(0, 100), false)
            .setContentIntent(openAppIntent())
            .addAction(0, ExportHost.label("cancel", "取消"), cancelIntent())
            .build()

    private fun buildTerminal(json: JSONObject, phase: String): Notification {
        val title = when (phase) {
            "done" -> ExportHost.label("done", "导出完成")
            "cancelled" -> ExportHost.label("cancelled", "导出已取消")
            else -> ExportHost.label("failed", "导出失败")
        }
        val path = json.optString("path")
        val name = path.substringAfterLast('/')
        val megabytes = json.optLong("bytes", 0L) / 1048576L
        val note = json.optString("message")
        val detail = when {
            phase != "done" -> note
            megabytes > 0 -> "$name · $megabytes MB" + if (note.isNotEmpty()) " · $note" else ""
            else -> name
        }
        return NotificationCompat.Builder(this, RESULT_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_export)
            .setContentTitle(title)
            .setContentText(detail)
            // The folder is the part that does not fit on one line, and it is the part the user wants.
            .setStyle(NotificationCompat.BigTextStyle().bigText(if (phase == "done") "$detail\n$path" else detail))
            .setOngoing(false)
            .setAutoCancel(true)
            .setContentIntent(openAppIntent())
            .build()
    }

    private fun cancelIntent(): PendingIntent = PendingIntent.getService(
        this, 1,
        Intent(this, ExportService::class.java).setAction(ACTION_CANCEL),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    private fun openAppIntent(): PendingIntent {
        val launch = packageManager.getLaunchIntentForPackage(packageName) ?: Intent(this, MainActivity::class.java)
        return PendingIntent.getActivity(
            this, 0, launch,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
