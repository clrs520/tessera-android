package com.tdashcam.studio

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ActivityNotFoundException
import android.content.BroadcastReceiver
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Configuration
import android.database.ContentObserver
import android.hardware.usb.UsbManager
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.os.StatFs
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.os.storage.StorageManager
import android.provider.MediaStore
import android.provider.Settings
import android.view.WindowManager
import android.view.accessibility.AccessibilityManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONArray
import androidx.activity.enableEdgeToEdge
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import java.io.File
import java.util.Locale
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

/**
 * Things the Tauri WebView cannot see or decide for itself:
 *
 * - System bar insets. `enableEdgeToEdge()` lets the WebView run under the status bar, but
 *   wry never hands the insets over, so `env(safe-area-inset-*)` stays 0 in the page. They
 *   become `--safe-*` custom properties on `<html>`.
 * - Whether "All Files Access" is actually granted. Without it Android returns an empty
 *   directory listing rather than EACCES, which is indistinguishable from a folder that
 *   really has no videos unless the permission itself is read.
 * - Which night mode the system is in, and the installed version name. The manifest pins
 *   `uiMode` in `configChanges`, so the activity is never recreated when the user flips dark
 *   mode and the WebView's own `prefers-color-scheme` can stay stale; the page reads the flag
 *   from here instead, and `onConfigurationChanged` re-pushes it.
 * - The two accessibility switches the page's solid-colour rules hang off — 「高对比度文本」 and
 *   「降低透明度」. `matchMedia` reports *false* for both in this WebView even with the switches
 *   on and the page freshly loaded, so the CSS media query path cannot fire here; the values come
 *   from `Settings` instead (see [stateJson]).
 * - Keeping the screen awake and going truly fullscreen. Both are window-level decisions the
 *   page can only ask for, so they arrive through `NativeBridge` as the player starts, pauses
 *   and fades its chrome.
 *
 * Back navigation is the page's business, not the activity's: `TauriActivity` sets
 * `handleBackNavigation = false`, so without a callback here the system back gesture just
 * finishes the activity and kills the app. The page reports how many closable layers it is
 * holding (folder browser, ⋮ menu, drawer) through `NativeBridge`, and the callback hands the
 * gesture to the page when there is something to close.
 */
// Neither switch has a public constant, and the WebView's matchMedia never reports either of them,
// so the keys are spelled out. These are exactly the rows the accessibility screen writes.
private const val KEY_HIGH_TEXT_CONTRAST = "accessibility_high_text_contrast_enabled"
private const val KEY_REDUCE_TRANSPARENCY = "transparency_level_effects_disabled"

// The float brightness key is not a public constant on every API level, hence the literal. It is
// what the panel is actually showing under automatic brightness, where the int key is only wherever
// the user last left the slider.
private const val KEY_SCREEN_BRIGHTNESS_FLOAT = "screen_brightness_float"
// R192 — the page's language, remembered so a notification raised while the page is asleep can
// speak the same language the user is reading.
private const val KEY_UI_LANG = "ui_lang"
private const val STORAGE_CHANNEL = "tessera_storage"
private const val STORAGE_NOTIFICATION_ID = 0x5CB0
private val CLIP_DIRS = listOf("RecentClips", "SavedClips", "SentryClips")

// A dashcam event lives in a folder named after the second it started: `2024-05-06_19-33-34`. It is
// also the only proof a delete request has that it is removing one event and not a whole volume.
private val EVENT_FOLDER = Regex("""^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}""")

/** What `/proc/mounts` says about one mount point: the filesystem under it, and whether it is `ro`. */
private data class MountInfo(val fs: String, val readOnly: Boolean)

class MainActivity : TauriActivity() {
    private var webView: WebView? = null
    private var insetDeclarations = ""
    // Lazy: `applicationContext` is not attached yet while field initialisers run.
    private val thumbFetcher by lazy {
        ThumbFetcher(applicationContext) { id, dataUrl -> publishThumb(id, dataUrl) }
    }
    private val volumeExecutor = Executors.newSingleThreadExecutor()
    private var pendingNotifAsk = false
    // R192: whether the page is on screen, and the mount event that arrived while it was not.
    @Volatile private var pageVisible = false
    private var volumeReceiver: BroadcastReceiver? = null
    private var pendingMountedPath: String? = null
    // R196 — 插盘这条链有三段：系统广播、原生探测、交给页面。哪一段断了，诊断里要能看出来。
    @Volatile private var volumeRx = 0
    @Volatile private var volumeTesla = 0
    @Volatile private var volumeDeliveries = 0
    @Volatile private var volumeAcks = 0
    @Volatile private var lastVolumeAction = ""
    @Volatile private var lastVolumeAtMs = 0L
    // R143: the safe-area and theme-follow push used to queue behind a delete on `volumeExecutor`, so
    // one slow FUSE removal held the insets and the night-mode flip for seconds — the plate jumped
    // back into the status bar while the user watched. Directory listings and deletions can wait for
    // each other; the page's own geometry cannot.
    private val stateExecutor = Executors.newSingleThreadExecutor()

    // The page's seat at the export table. [ExportHost] belongs to the process, not to this
    // activity, so the job keeps running when the seat is empty; everything the page missed is
    // recovered from [ExportHost.statusJson] rather than replayed here.
    private val exportObserver: (String) -> Unit = { payload -> publishExportProgress(payload) }

    // Flipping either accessibility switch changes nothing the activity would otherwise be told
    // about: no configuration change, no inset change, no recreate. Without this the page keeps
    // its translucent panels until the next time it is foregrounded.
    private val accessibilityObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
        override fun onChange(selfChanging: Boolean) {
            scheduleStatePush()
        }
    }

    // Written on the WebView's JS thread, read on the UI thread by the back callback.
    private val backLayers = AtomicInteger(0)

    // Whether the page has told us it exists. See [pushState].
    @Volatile private var pageReady = false
    private var pushScheduled = false

    /**
     * How far the page wants the panel pushed above the system slider, as 0..1 of the remaining
     * headroom — or null for "this window takes what the system gives".
     *
     * The number is kept here rather than in the page because the value it is added to is not ours:
     * the user's slider moves underneath it, and a boost resolved once into an absolute
     * `screenBrightness` stops following the slider from the moment it is written. See
     * [brightnessObserver].
     */
    @Volatile private var screenBoost: Float? = null

    // The slider moving is not a configuration change, not an inset change and not a focus change:
    // with a boost in play this is the only thing that says the base has to be read again. Without
    // it the window keeps the absolute level computed from wherever the slider happened to sit when
    // the finger came up.
    private val brightnessObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
        override fun onChange(selfChanging: Boolean) {
            if (screenBoost != null) runOnUiThread { writeScreenBrightness() }
        }
    }

    // The page cannot know which build it is running: BuildConfig is off for library modules,
    // so the version comes from the package manager and is shown in the drawer footer.
    private val appVersionName: String by lazy {
        runCatching { packageManager.getPackageInfo(packageName, 0).versionName }.getOrNull() ?: ""
    }

    /**
     * Registered in [onCreate] rather than asked for on a tap, because the framework only allows a
     * launcher to be created while the activity is still being created. The answer goes back to the
     * page, which owns the wording of what happens next.
     */
    private lateinit var notificationPermission: ActivityResultLauncher<String>
    /**
     * API 24–29 has no 「所有文件访问」 switch at all; the way in is the runtime permission, and
     * `stateJson()` reading it without anything ever asking left every one of those devices
     * forever blocked: the banner showed, the tap opened 应用详情, and no dialog existed to
     * grant it. Registered here for the same framework reason as the notification one.
     */
    private lateinit var legacyStoragePermission: ActivityResultLauncher<String>

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        notificationPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            publishNotificationPermission(granted)
        }
        legacyStoragePermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            pushState()
            if (granted) webView?.post {
                webView?.evaluateJavascript(
                    "try{window.viewer&&window.viewer.updatePermissionBanner&&window.viewer.updatePermissionBanner()" +
                        "}catch(e){}", null)
            }
        }
        ExportHost.addObserver(exportObserver)
        contentResolver.registerContentObserver(
            Settings.Secure.getUriFor(KEY_HIGH_TEXT_CONTRAST), true, accessibilityObserver
        )
        contentResolver.registerContentObserver(
            Settings.Global.getUriFor(KEY_REDUCE_TRANSPARENCY), true, accessibilityObserver
        )
        // Both keys, because which one the slider writes depends on whether automatic brightness is
        // on, and the page's boost has to track the slider either way.
        contentResolver.registerContentObserver(
            Settings.System.getUriFor(Settings.System.SCREEN_BRIGHTNESS), true, brightnessObserver
        )
        contentResolver.registerContentObserver(
            Settings.System.getUriFor(KEY_SCREEN_BRIGHTNESS_FLOAT), true, brightnessObserver
        )
        // R192 — 卷的插拔。运行时注册：Android 8+ 的隐式广播限制不允许把 MEDIA_MOUNTED 写进 manifest。
        registerVolumeReceiver()

        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { _, insets ->
            applyInsets(insets)
            // Going fullscreen takes the bars away, which changes these values; without a
            // re-push the page would keep reserving room for a bar that is no longer there.
            scheduleStatePush()
            // Hand the insets back untouched: the WebView still needs them.
            insets
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val view = webView
                if (backLayers.get() <= 0 || view == null) {
                    // Nothing open in the page: let the dispatcher fall through to the
                    // default behaviour, which finishes the activity and plays the system
                    // back animation.
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                    isEnabled = true
                    return
                }
                // Consume optimistically; if the page turns out to have nothing left to
                // close, fall through to the default behaviour in the same gesture.
                view.evaluateJavascript("window.__tdashcamCloseTopLayer && window.__tdashcamCloseTopLayer()") { result ->
                    if (result != "true") {
                        backLayers.set(0)
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })
    }

    override fun onWebViewCreate(webView: WebView) {
        this.webView = webView
        // R24-5: a vendor "大字体 / Display size" setting multiplies the WebView's text zoom, while
        // the phone chrome — the bottom bar, the ⋮ panel, the 详细数据 plate, the export sheet — is
        // built from fixed-height rows. The scaled glyphs clipped mid-height and the plates ran past
        // their own rounded corners on exactly the phones whose owners turn that setting on. Pinning
        // it keeps the layout honest on every density; the page's type is already `rem`-sized and its
        // smallest phone breakpoint is written for a 320px screen.
        webView.settings.textZoom = 100
        // The page owns gesture scaling now (two fingers on a feed), so the WebView's own
        // pinch-zoom of the whole document would fight it and repaint the fixed layers.
        webView.settings.setSupportZoom(false)
        // Back layers and inset pushes are the activity's, not the page's.
        backLayers.set(0)
        webView.addJavascriptInterface(NativeBridge(this), "TDashcamNative")
        // The page does not exist yet here, so a single push would be wiped by the first
        // navigation. Repeat until the app UI is up; pushing is cheap and idempotent. The last
        // rung also opens the gate unconditionally: if the page never reports in — a build where
        // the ready call is missing or throws — it still gets its safe-area values.
        webView.post { pushState() }
        webView.postDelayed({ pushState() }, 400)
        webView.postDelayed({ pushState() }, 1200)
        webView.postDelayed({
            pageReady = true
            pushState()
        }, 2500)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        // Covers rotation, split-screen resize and returning from the permission screen.
        if (hasFocus) scheduleStatePush()
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        // `uiMode` is declared in `configChanges`, so this is the only signal that the system
        // flipped dark mode; nothing else tells the page.
        scheduleStatePush()
    }

    override fun onDestroy() {
        volumeReceiver?.let { runCatching { unregisterReceiver(it) } }
        volumeReceiver = null
        // Only the page's seat at the table goes. The job itself is the service's business now: it
        // runs to the end whether this activity is alive or not, and a decoder kept running with
        // nobody watching is a *notification*, not a leak — see [ExportService].
        ExportHost.removeObserver(exportObserver)
        contentResolver.unregisterContentObserver(accessibilityObserver)
        contentResolver.unregisterContentObserver(brightnessObserver)
        // These are per-activity executors: a font-size change recreates the activity, and without
        // this every recreation left three non-daemon threads behind.
        volumeExecutor.shutdownNow()
        stateExecutor.shutdownNow()
        super.onDestroy()
    }

    fun onBackLayersChanged(count: Int) {
        backLayers.set(if (count < 0) 0 else count)
    }

    /**
     * `enableEdgeToEdge()` derives the status/navigation bar icon colour from the *system*
     * night mode, but the page's theme can be set independently of it, so the page pushes its
     * own choice down: light bars need dark icons.
     */
    fun applyBarAppearance(lightBars: Boolean) {
        runOnUiThread {
            val controller = WindowCompat.getInsetsController(window, window.decorView)
            controller.isAppearanceLightStatusBars = lightBars
            controller.isAppearanceLightNavigationBars = lightBars
        }
    }

    /**
     * The app's own external folder, asked for rather than string-built. `Android/data` is not
     * writable by the app on Android 11+ (`read_dir` on it answers EACCES, so a `mkdir` of the
     * package folder there fails the same way), which means the path the Rust side assembles by
     * concatenation does not exist until the framework creates it — and only this call does that.
     * Empty means "this device will not give one", which the page has to stop offering.
     */
    fun appFilesDir(): String {
        val dir = runCatching { getExternalFilesDir(null) }.getOrNull() ?: return ""
        runCatching { dir.mkdirs() }
        return if (dir.isDirectory) dir.absolutePath else ""
    }

    /**
     * Where the page is allowed to write a file the user asked for. The page used to hardcode
     * `/storage/emulated/0/Download`, which is this device's answer and not a universal one: a work
     * profile, a device whose primary volume is mounted elsewhere, or a shell with no Download folder
     * at all all disagree. Pushed as a field rather than exposed as a synchronous return method, so
     * an iOS shell can answer the same field through its own state push. Empty means "nothing to
     * offer", and the page keeps its fallback instead of writing to a path it just invented.
     */
    fun downloadDir(): String {
        val dir = runCatching {
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        }.getOrNull() ?: return ""
        runCatching { dir.mkdirs() }
        return if (dir.isDirectory) dir.absolutePath else ""
    }

    /**
     * Open the system screen that actually grants "All Files Access". Listing the five menus
     * in a toast never got anyone there, and the vendor skins disagree on where the toggle
     * lives, so try the app-specific screen and fall back to the app details page.
     */
    fun openStorageSettings() {
        runOnUiThread {
            val data = Uri.parse("package:$packageName")
            // API 24–29: the system dialog is the way in. Sending those users to 应用详情 (all the
            // fallback below can offer there) shows a page with a storage row that grants nothing,
            // which is how #13 looked fixed while every scan on those devices still failed.
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
                val ask = runCatching {
                    legacyStoragePermission.launch(Manifest.permission.READ_EXTERNAL_STORAGE)
                }.isSuccess
                if (ask) return@runOnUiThread
            }
            val intents = buildList {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    add(Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, data))
                }
                add(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, data))
            }
            for ((index, intent) in intents.withIndex()) {
                try {
                    startActivity(intent)
                    return@runOnUiThread
                } catch (e: ActivityNotFoundException) {
                    if (index < intents.lastIndex) continue
                } catch (e: SecurityException) {
                    if (index < intents.lastIndex) continue
                }
            }
        }
    }

    /**
     * `window.open` goes nowhere in this WebView (wry never creates a second window) and the
     * opener plugin is not in the mobile bundle, so the map and repository links were silent
     * no-ops. Hand an http(s) URL to the system browser; anything else is refused.
     */
    fun openExternal(url: String) {
        val target = runCatching { Uri.parse(url) }.getOrNull()
        when (target?.scheme?.lowercase()) {
            "http", "https" -> {}
            else -> return
        }
        runOnUiThread {
            try {
                startActivity(Intent(Intent.ACTION_VIEW, target).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            } catch (e: ActivityNotFoundException) {
                // No browser on the device: there is nowhere to send the user.
            }
        }
    }

    /**
     * Hand one finished clip to another app. A `file://` Uri throws `FileUriExposedException` the
     * moment a second process is handed it, so the answer has to be the MediaStore Uri for that
     * path — which the export's own media scan normally has already created by the time the sheet
     * says 「已保存」. The scan-and-look-again covers the tap that beats the scanner.
     *
     * Returns a reason rather than throwing so the page, which owns every word on screen, can say
     * what happened in the language it is speaking.
     */
    fun shareFile(path: String, title: String): String {
        if (!File(path).isFile) return "missing"
        val uri = mediaUriFor(path) ?: run {
            runCatching {
                MediaScannerConnection.scanFile(this, arrayOf(path), arrayOf("video/mp4"), null)
            }
            mediaUriFor(path)
        } ?: return "unindexed"
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "video/mp4"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        // `packageManager.resolveActivity` is *not* asked whether anything could take this: on
        // Android 11+ package-visibility filtering answers null unless a `<queries>` entry names the
        // intent, so the check would have read 「没有能接收视频的应用」 on every phone that has ten.
        // The chooser is the resolution — it is the system's own words for "nothing here" — and
        // starting it belongs on the UI thread, the same way [openExternal] puts it.
        val chooser = Intent.createChooser(send, title.ifBlank { null })
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        // The guard belongs *inside* the UI-thread block: a `runCatching` around `runOnUiThread`
        // catches only the posting, and a throw later would take the app down for a share.
        runOnUiThread {
            try {
                startActivity(chooser)
            } catch (e: Exception) {
                // Nothing here can take a video, or the window went away while the sheet opened. The
                // chooser is the system's own screen and it says so in the user's language; this page
                // has already been told the clip was handed over, and a failed share must not cost
                // the app the export it just finished.
            }
        }
        return "ok"
    }

    /** The MediaStore row whose stored path is exactly this file, as a shareable content Uri. */
    private fun mediaUriFor(path: String): Uri? = runCatching {
        contentResolver.query(
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
            arrayOf(MediaStore.Video.Media._ID),
            "${MediaStore.Video.Media.DATA} = ?",
            arrayOf(path),
            null,
        )?.use { cursor ->
            if (!cursor.moveToFirst()) return@use null
            ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, cursor.getLong(0))
        }
    }.getOrNull()

    /**
     * Clipping is MediaCodec work, not WebView work: a multi-megabyte MP4 cannot cross the JS bridge
     * (the existing `write_binary_file` path serialises bytes as a JSON array), and the page has no
     * way to decode six streams at once. So the page describes the job and the engine runs it on its
     * own thread under [ExportService], publishing progress back through
     * `__tdashcamExportProgress`.
     */
    fun beginExport(requestJson: String): String {
        val id = ExportHost.submit(applicationContext, requestJson)
        return """{"id":$id}"""
    }

    fun cancelExport(id: Long) {
        ExportHost.cancel(id)
    }

    fun exportStatusJson(): String = ExportHost.statusJson()

    fun exportStatusSeen() {
        ExportHost.markDelivered()
    }

    fun exportCodecReport(width: Int, height: Int): String = ExportHost.codecReport(width, height)

    fun exportCodecProbe(): String = ExportHost.codecProbe()

    /**
     * Whether the export notification will actually be seen. The job runs either way — a foreground
     * service is allowed to exist without the notification permission, Android just hides its
     * notification — so this decides the page's wording, not the export.
     */
    fun notificationsAllowed(): Boolean = NotificationManagerCompat.from(this).areNotificationsEnabled()

    /** No-op below Android 13, where notifications are granted at install and always allowed. */
    fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        if (notificationsAllowed()) return
        runOnUiThread {
            // `launch` 在 Activity 不是 RESUMED 时抛 IllegalStateException；以前被 runCatching 吞成
            // no-op，而页面已经把「问过了」写进 localStorage，于是这个安装永远不再申请。
            val ok = runCatching { notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS) }.isSuccess
            if (!ok) pendingNotifAsk = true
        }
    }

    private fun publishNotificationPermission(granted: Boolean) {
        val view = webView ?: return
        view.post {
            view.evaluateJavascript(
                "try{window.__tdashcamNotifPermission&&window.__tdashcamNotifPermission($granted)}catch(e){}",
                null
            )
        }
    }

    fun requestThumb(id: String, path: String, millis: Long, width: Int) {
        thumbFetcher.request(id, path, millis, width)
    }

    /**
     * R190 — hold a foreground service while a scan runs. The walk itself is native and off the UI
     * thread, but the process behind it is an ordinary cached one the moment the user locks the
     * screen: Android 12+ freezes it, so a 70 s walk simply stops. The page asks for this around
     * `loadTauriDirectory` and drops it in `finally`; a request that arrives from a place Android
     * forbids is swallowed by [ScanService.start] rather than taking the scan down with it.
     */
    fun setScanKeepAlive(active: Boolean, text: String) {
        if (active) ScanService.start(this, text) else ScanService.stop(this)
    }

    /**
     * Base64 JPEG crosses back as a string literal, so the payload has to stay quoted: the id is
     * minted by the page and the data URL is alphabet-safe by construction.
     */
    private fun publishThumb(id: String, dataUrl: String?) {
        val view = webView ?: return
        val arg = if (dataUrl == null) "null" else "'$dataUrl'"
        view.post {
            view.evaluateJavascript(
                "try{window.__tdashcamNativeThumb&&window.__tdashcamNativeThumb('$id',$arg)}catch(e){}",
                null
            )
        }
    }

    private fun publishExportProgress(payload: String) {
        val view = webView ?: return
        // evaluateJavascript is UI-thread only, and the engine reports from its worker thread.
        view.post {
            view.evaluateJavascript(
                "try{window.__tdashcamExportProgress&&window.__tdashcamExportProgress($payload)}catch(e){}",
                null
            )
        }
    }

    /**
     * Six-camera playback is evidence the user is reading, not a screen to lock.
     * `FLAG_KEEP_SCREEN_ON` is scoped to the window's visibility, so backgrounding the app
     * releases it without any bookkeeping here, and unlike a WakeLock it needs no permission.
     */
    fun applyKeepScreenOn(keep: Boolean) {
        runOnUiThread {
            if (keep) {
                window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            } else {
                window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    private var holdsAudioFocus = false
    // R85: what the page *wants*, kept apart from what the system has granted. `onPause` has to give
    // the speaker back — see `onPause` — and the page cannot ask again on its own, because the JS timer
    // that would notice is frozen with the WebView. Same shape as [screenBoost] below.
    private var audioFocusWanted = false

    @Suppress("DEPRECATION")
    private val legacyFocusListener = android.media.AudioManager.OnAudioFocusChangeListener { change ->
        onAudioFocusChange(change)
    }

    private var focusRequest: AudioFocusRequest? = null

    /**
     * Playing video out loud borrows the speaker, and the phone owns that loan: a call has to be
     * able to take it back. The page asks when playback starts and releases when it stops;
     * whatever the system decides afterwards is forwarded to `__tdashcamAudioFocus`.
     *
     * Nothing resumes on regaining focus. Having watched something before an interruption is not
     * consent to it making noise again afterwards.
     */
    fun applyAudioFocus(active: Boolean) {
        audioFocusWanted = active
        runOnUiThread { if (active) claimAudioFocus() else releaseAudioFocus() }
    }

    /**
     * R85: `AUDIOFOCUS_GAIN` *stops* whatever else is playing, and this app has nothing to put in its
     * place — Tesla writes no audio track and the per-camera sound feature was deleted in R25, so
     * pressing play silenced the user's music with a silent screen. `TRANSIENT_MAY_DUCK` keeps the one
     * thing the loan is actually for (the loss callback still arrives, so an incoming call still pauses
     * playback) without evicting the other app, and the claim is given up when the app leaves the
     * foreground instead of being held by a process nobody is looking at.
     */
    @Suppress("DEPRECATION")
    private fun claimAudioFocus() {
        if (holdsAudioFocus) return
        val manager = getSystemService(AUDIO_SERVICE) as? AudioManager ?: return
        val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val request = focusRequest
                ?: AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                    .setOnAudioFocusChangeListener { change -> onAudioFocusChange(change) }
                    .build()
                    .also { focusRequest = it }
            manager.requestAudioFocus(request)
        } else {
            manager.requestAudioFocus(
                legacyFocusListener,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
            )
        }
        holdsAudioFocus = granted == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
    }

    @Suppress("DEPRECATION")
    private fun releaseAudioFocus() {
        if (!holdsAudioFocus) return
        val manager = getSystemService(AUDIO_SERVICE) as? AudioManager
        if (manager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                focusRequest?.let { manager.abandonAudioFocusRequest(it) }
            } else {
                manager.abandonAudioFocus(legacyFocusListener)
            }
        }
        holdsAudioFocus = false
    }

    private fun onAudioFocusChange(change: Int) {
        val kind = when (change) {
            AudioManager.AUDIOFOCUS_LOSS -> "loss"
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> "transient"
            AudioManager.AUDIOFOCUS_GAIN -> "gain"
            else -> return
        }
        val view = webView ?: return
        view.post {
            view.evaluateJavascript(
                "try{window.__tdashcamAudioFocus&&window.__tdashcamAudioFocus('$kind')}catch(e){}",
                null
            )
        }
    }

    /**
     * Named taps rather than millisecond patterns, so the same words can be answered by
     * `UIImpactFeedbackGenerator` on iOS. `createPredefined` only exists on API 29+, and a device
     * with no vibrator is normal, so both branches stay quiet on failure.
     */
    fun applyHaptic(kind: String) {
        runOnUiThread {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                (getSystemService(VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(VIBRATOR_SERVICE) as? Vibrator
            } ?: return@runOnUiThread
            if (!vibrator.hasVibrator()) return@runOnUiThread
            val ok = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android spells these `tick / click / doubleClick / heavyClick` and has no light
                // impact, so `light` shares the standard tap and only `success` gets the double.
                val effect = when (kind) {
                    "selection" -> VibrationEffect.EFFECT_TICK
                    "medium", "light" -> VibrationEffect.EFFECT_CLICK
                    "success" -> VibrationEffect.EFFECT_DOUBLE_CLICK
                    "heavy", "error" -> VibrationEffect.EFFECT_HEAVY_CLICK
                    else -> VibrationEffect.EFFECT_CLICK
                }
                runCatching { vibrator.vibrate(VibrationEffect.createPredefined(effect)) }.isSuccess
            } else {
                false
            }
            if (!ok) {
                val millis = when (kind) {
                    "heavy", "error" -> 30L
                    "medium" -> 18L
                    "selection" -> 8L
                    "success" -> 16L
                    else -> 10L
                }
                runCatching { vibrator.vibrate(millis) }
            }
        }
    }

    /**
     * Where the system's own brightness slider sits, as a 0..1 fraction. Two callers want it: the
     * boost resolution in [writeScreenBrightness], which has to start from there so a boost is
     * *above* the slider rather than from zero, and the page's 复制诊断 line, which has to say what
     * the slider said.
     *
     * In manual mode the stored value is an int 0..255. In automatic mode that int is whatever the
     * user last left on the slider, not what the panel is showing, so the float key is asked for
     * instead — it is not a public constant on every API level, hence the literal.
     */
    fun systemBrightnessFraction(): String {
        val resolver = contentResolver
        val automatic = runCatching {
            Settings.System.getInt(resolver, Settings.System.SCREEN_BRIGHTNESS_MODE) ==
                Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC
        }.getOrDefault(false)
        if (automatic) {
            val float = runCatching { Settings.System.getFloat(resolver, KEY_SCREEN_BRIGHTNESS_FLOAT) }
                .getOrNull()
            if (float != null) return "%.3f".format(Locale.US, float.coerceIn(0.01f, 1f))
        }
        val percent = runCatching {
            Settings.System.getInt(resolver, Settings.System.SCREEN_BRIGHTNESS)
        }.getOrDefault(128)
        return "%.3f".format(Locale.US, (percent / 255f).coerceIn(0.01f, 1f))
    }

    /**
     * The page's dim layer can only take light away. Making the panel *brighter* than the system
     * slider is a window decision — `screenBrightness` overrides the system value for this window
     * up to the panel maximum, which is what lets a dashcam clip read at all with the phone turned
     * down.
     *
     * What the page sends is the *boost*, not the level: 0..1 of the headroom between wherever the
     * slider sits and full, negative meaning "take it back". Resolving that to an absolute value is
     * this activity's job precisely because the slider is not ours — see [brightnessObserver] for
     * the re-resolve, and [onPause] for who the override is allowed to apply to.
     */
    fun applyScreenBoost(value: Float) {
        screenBoost = if (value < 0f) null else value.coerceIn(0f, 1f)
        runOnUiThread { writeScreenBrightness() }
    }

    private fun writeScreenBrightness() {
        val params = window.attributes
        val boost = screenBoost
        val next = if (boost == null) {
            WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
        } else {
            val base = systemBrightnessFraction().toFloatOrNull()?.coerceIn(0.01f, 1f) ?: 0.5f
            (base + (1f - base) * boost).coerceIn(0.01f, 1f)
        }
        if (params.screenBrightness == next) return
        params.screenBrightness = next
        window.attributes = params
    }

    /**
     * A window override is a claim on the *panel*, and the panel is shared. Leaving it set while the
     * user is looking at another app means Tessera's boost is the brightness of someone else's
     * screen — which is exactly the complaint this replaces. The intent survives in [screenBoost];
     * [onResume] puts the claim back when the page is the one on screen again.
     */
    override fun onPause() {
        super.onPause()
        pageVisible = false
        // R85: the speaker is a claim as well, and a process nobody is looking at has no business
        // holding one. The page cannot hand it back — `WryActivity.onPause` freezes the WebView before
        // any JS could notice — so the activity gives it up here and takes it again on resume for as
        // long as the page still wants it.
        if (audioFocusWanted) runOnUiThread { releaseAudioFocus() }
        if (screenBoost == null) return
        runOnUiThread {
            val params = window.attributes
            if (params.screenBrightness == WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE) return@runOnUiThread
            params.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
            window.attributes = params
        }
    }

    override fun onResume() {
        super.onResume()
        pageVisible = true
        // R192: a drive that arrived while the page was asleep was only announced by a notification;
        // now that the page is back, tell it the same thing the foreground path would have told it.
        flushPendingVolume()
        runOnUiThread {
            writeScreenBrightness()
            if (audioFocusWanted) claimAudioFocus()
            // 通知权限在非 RESUMED 时申请会抛异常（被吞成 no-op，而页面已把「问过了」落盘）。
            // 留一个待办，回到前台再试一次。
            if (pendingNotifAsk) { pendingNotifAsk = false; askNotificationPermission() }
        }
    }

    /**
     * Fade-to-black chrome is not fullscreen: the status and navigation bars kept claiming
     * their height. Hide them the way a video app does — swipe from an edge to bring them back
     * transiently — and re-push the insets, because `--safe-*` is what the page pads itself with
     * and they are zero while the bars are gone.
     */
    fun applyFullscreen(fullscreen: Boolean) {
        runOnUiThread {
            val controller = WindowCompat.getInsetsController(window, window.decorView)
            if (fullscreen) {
                controller.systemBarsBehavior =
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                controller.hide(WindowInsetsCompat.Type.systemBars())
            } else {
                controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_DEFAULT
                controller.show(WindowInsetsCompat.Type.systemBars())
            }
            // Nothing else tells the page when its `--safe-*` values stop being zero, so the
            // inset listener in `onCreate` re-pushes them as the bars come and go. Hiding a bar
            // does not resize an edge-to-edge window, so no dispatch is guaranteed on its own.
            ViewCompat.requestApplyInsets(window.decorView)
        }
    }

    private fun applyInsets(insets: WindowInsetsCompat) {
        val bars = insets.getInsets(
            WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
        )
        val cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout())
        val statusBarsVisible = insets.isVisible(WindowInsetsCompat.Type.statusBars())
        val density = resources.displayMetrics.density
        if (density <= 0f) return

        // `getInsets` keeps reporting the height of a bar the controller has hidden, so the
        // visibility flags are the only honest signal that the page should stop reserving room
        // for it. Left and right are the cutout's, which no app can hide, so they pass through.
        //
        // The top edge is the one place the two sources have to be told apart: in fullscreen the
        // status bar hides, but a display cutout is hardware and stays. Reporting 0 there would
        // let the page paint under the camera — so the top falls back to the cutout height (0 on
        // devices without one, where hiding the bar really does free the band).
        val topInset = if (statusBarsVisible) bars.top else cutout.top
        //
        // CSS pixels on a `width=device-width` WebView are Android dp, so divide by density.
        // max() keeps whatever the WebView itself reports through env() if it ever wins — except
        // for a hidden bar, where Chromium's own env() is the thing we are trying to override.
        // Edge-to-edge means the window is never resized for the keyboard, it just slides over the
        // WebView, and `visualViewport.height` on this build keeps reporting the full viewport. The
        // IME height therefore only exists here, and the bottom sheet needs it to keep its two time
        // inputs out from under the keys. iOS has no such callback — there `--kb-vv-h`, measured from
        // `visualViewport` in the page, is the only signal; styles.css takes the deeper of the two.
        val ime = "%.1f".format(Locale.US, insets.getInsets(WindowInsetsCompat.Type.ime()).bottom / density)

        insetDeclarations = listOf(
            "top" to (topInset to (statusBarsVisible || cutout.top > 0)),
            "bottom" to (bars.bottom to insets.isVisible(WindowInsetsCompat.Type.navigationBars())),
            "left" to (bars.left to true),
            "right" to (bars.right to true),
        ).joinToString(separator = "") { (edge, pair) ->
            val (px, visible) = pair
            val dp = "%.1f".format(Locale.US, px / density)
            if (visible) {
                "s.setProperty('--safe-$edge','max(env(safe-area-inset-$edge, 0px), ${dp}px)');"
            } else {
                "s.setProperty('--safe-$edge','0px');"
            }
        } + "s.setProperty('--kb-native-h','${ime}px');"
    }

    /**
     * Which storages are reachable *right now*: shared internal storage, an SD card, and a dashcam
     * stick on an OTG cable. `StorageManager` is the authority on human names and on whether a
     * volume is actually mounted, but OEM ROMs disagree about which removable volumes they list, so
     * `/storage` is scanned too and the two are merged by path.
     *
     * This answers without listing one directory, because a `@JavascriptInterface` call runs on the
     * WebView's UI thread and the page polls this every twelve seconds: a `listFiles()` here is a
     * stall that repeats, and on the root of a stick holding a few thousand event folders it can run
     * past the five-second input timeout — which is the ANR people called 「选中文件夹后卡死」.
     * Counts come from [requestVolumeCounts] instead. `entries: -2` means "not counted yet".
     */
    @Volatile private var storageVolumesCache: String? = null

    /**
     * 桥线程不许等 FUSE：U 盘挂起时一次 `listFiles()`/`StatFs` 能阻塞几十秒，整条 JS 桥（缩略图、
     * 删除回执、状态推送）跟着排队 —— 与 R27-2 那类卡死同源。每次调用只交出上一次算好的那份，
     * 真正的读取放到 `volumeExecutor` 上，给下一次用。
     */
    fun storageVolumesJson(): String {
        val cached = storageVolumesCache
        runCatching {
            volumeExecutor.execute {
                runCatching { computeStorageVolumesJson() }.onSuccess { storageVolumesCache = it }
            }
        }
        return cached ?: computeStorageVolumesJson().also { storageVolumesCache = it }
    }

    private fun computeStorageVolumesJson(): String {
        val mounts = mountTable()
        val items = LinkedHashMap<String, List<String>>()
        // `getStorageVolumes`, `getDirectory` and `getDescription` are all newer than minSdk 24,
        // so each one is behind `runCatching` rather than an SDK check: a ROM that lacks it,
        // or that throws for a non-system caller, simply leaves the `/storage` scan below to
        // answer on its own.
        val reported = runCatching { getSystemService(StorageManager::class.java)?.storageVolumes }
            .getOrNull() ?: emptyList()
        for (volume in reported) {
            val dir = runCatching { volume.directory }.getOrNull() ?: continue
            val path = dir.absolutePath
            if (path == "/" || path == "/storage") continue
            val label = runCatching { volume.getDescription(this)?.toString() }.getOrNull().orEmpty()
            items[path] = listOf(label, volume.isPrimary.toString(), volume.isRemovable.toString())
        }
        // OTG mount points are vendor-named (`/storage/UsbDriveA`, `/storage/usbdisk1`,
        // `/storage/1234-5678`) and show up here even when StorageManager stays silent. `/storage`
        // itself is a tmpfs with a handful of entries, so this one listing is not the cost the
        // paragraph above is about.
        for (child in File("/storage").listFiles() ?: emptyArray()) {
            val name = child.name
            if (!child.isDirectory) continue
            if (name in setOf("emulated", "self", "users", "storage", "tmp", "private", "linker")) continue
            if (items.containsKey(child.absolutePath)) continue
            items[child.absolutePath] = listOf(name, "false", "true")
        }

        val volumes = items.entries.joinToString(separator = ",") { (path, fields) ->
            val mount = mounts[path]
            val (total, free) = volumeCapacity(path)
            "{\"path\":${jsonString(path)},\"label\":${jsonString(fields[0])}," +
                "\"primary\":${fields[1]},\"removable\":${fields[2]},\"entries\":-2," +
                "\"fs\":${jsonString(mount?.fs ?: "")}," +
                "\"readOnly\":${mount?.readOnly == true}," +
                "\"total\":$total,\"free\":$free}"
        }
        val usbDevices = runCatching {
            getSystemService(UsbManager::class.java)?.deviceList?.size
        }.getOrNull() ?: 0
        return """{"volumes":[$volumes],"usbDevices":$usbDevices}"""
    }

    /**
     * The filesystem each mount under `/storage` is actually on, and whether it is read-only.
     * `StorageVolume` will say `public` or `usb` and stop there, which is no help when the question
     * is "why can't this phone read my 2 TB stick" — the answer is nearly always that it is NTFS or
     * ext4, and Android mounts neither.
     *
     * Android layers a permission-emulating FUSE mount over the real one, so a mount point can have
     * two lines; the block-backed one carries the truth, so `fuse`/`sdcardfs`/`tmpfs` lose to
     * anything else that names the same path.
     */
    private fun mountTable(): Map<String, MountInfo> {
        val text = runCatching { File("/proc/mounts").readText() }.getOrNull() ?: return emptyMap()
        val out = HashMap<String, MountInfo>()
        for (line in text.lineSequence()) {
            val fields = line.split(' ')
            if (fields.size < 4 || !fields[1].startsWith("/storage/")) continue
            val mountPoint = fields[1].replace("\\040", " ").replace("\\011", "\t")
            val fs = fields[2].lowercase()
            if (fs == "fuse" || fs == "sdcardfs" || fs == "tmpfs") continue
            val options = fields[3].split(',')
            out[mountPoint] = MountInfo(fs, options.contains("ro"))
        }
        return out
    }

    /**
     * Bytes, not blocks: the classic `blockCount * blockSize` on a 2 TB stick is 2e12, which overflows
     * the Int the pre-API-18 accessors return and comes back as a negative capacity.
     */
    private fun volumeCapacity(path: String): Pair<Long, Long> {
        val stat = runCatching { StatFs(path) }.getOrNull() ?: return 0L to 0L
        return runCatching {
            stat.blockCountLong * stat.blockSizeLong to stat.availableBlocksLong * stat.blockSizeLong
        }.getOrDefault(0L to 0L)
    }

    /**
     * Entry counts, off the UI thread. The page shows these to tell 「the folder is empty」 apart from
     * 「the drive is mounted somewhere this app may not read」, and to grey out a volume it cannot
     * list — both of which are worth a second round trip and neither of which is worth a freeze.
     */
    fun requestVolumeCounts() {
        val paths = (runCatching { File("/storage").list() }.getOrNull() ?: emptyArray())
            .filter { it !in setOf("emulated", "self", "users", "storage", "tmp", "private", "linker") }
            .map { "/storage/$it" } + "/storage/emulated/0"
        volumeExecutor.execute {
            val body = paths.joinToString(separator = ",") { path ->
                val count = runCatching { File(path).listFiles()?.size ?: -1 }.getOrDefault(-1)
                "${jsonString(path)}:$count"
            }
            publishVolumeCounts("""{$body}""")
        }
    }

    private fun publishVolumeCounts(payload: String) {
        val view = webView ?: return
        view.post {
            view.evaluateJavascript(
                "try{window.__tdashcamVolumeCounts&&window.__tdashcamVolumeCounts($payload)}catch(e){}",
                null
            )
        }
    }

    private fun jsonString(value: String): String =
        "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

    /**
     * R192 — 卷的插拔事件。
     *
     * 页面自己每 12 秒轮询一次 `/storage`，可 WebView 在后台/熄屏时被系统暂停，轮询不跑：插上盘再
     * 回来，列表还是旧的、要等下一轮。这里直接收系统的 MEDIA_MOUNTED / UNMOUNTED（运行时注册——
     * Android 8+ 的隐式广播限制不允许写进 manifest），插上时先在后台线程确认它有没有 TeslaCam：
     * 人在页面上 → 立刻告诉页面（省掉那最多 12 秒的等待）；人不在 → 发一条通知，点开就回到 APP，
     * 回来时再把这条事件补给它。
     */
    private fun registerVolumeReceiver() {
        if (volumeReceiver != null) return
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val action = intent?.action ?: return
                val path = intent.data?.path ?: return
                volumeRx += 1
                lastVolumeAction = action.substringAfterLast('.')
                lastVolumeAtMs = android.os.SystemClock.elapsedRealtime()
                when (action) {
                    Intent.ACTION_MEDIA_MOUNTED -> volumeExecutor.execute {
                        val tesla = probeTeslaCamRoot(path) ?: return@execute
                        runOnUiThread { onVolumeMounted(tesla) }
                    }
                    Intent.ACTION_MEDIA_UNMOUNTED, Intent.ACTION_MEDIA_REMOVED,
                    Intent.ACTION_MEDIA_EJECT, Intent.ACTION_MEDIA_BAD_REMOVAL -> {
                        // 后台拔盘不打扰：回来时页面的轮询会把过期目录清掉。
                        if (pageVisible) deliverVolumeEvent("removed", path)
                    }
                }
            }
        }
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_MEDIA_MOUNTED)
            addAction(Intent.ACTION_MEDIA_UNMOUNTED)
            addAction(Intent.ACTION_MEDIA_REMOVED)
            addAction(Intent.ACTION_MEDIA_EJECT)
            addAction(Intent.ACTION_MEDIA_BAD_REMOVAL)
            addDataScheme("file")
        }
        val ok = runCatching {
            ContextCompat.registerReceiver(this, receiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
        }.isSuccess
        if (ok) volumeReceiver = receiver
    }

    /** The folder to open for a freshly mounted volume: the TeslaCam root, or null if it has none. */
    private fun probeTeslaCamRoot(path: String): String? {
        val root = File(path)
        if (root.name == "TeslaCam" && root.isDirectory) return path
        val nested = File(root, "TeslaCam")
        if (nested.isDirectory) return nested.absolutePath
        if (CLIP_DIRS.any { File(root, it).isDirectory }) return path
        return null
    }

    private fun onVolumeMounted(teslaPath: String) {
        volumeTesla += 1
        if (pageVisible) {
            deliverVolumeEvent("mounted", teslaPath)
            return
        }
        pendingMountedPath = teslaPath
        notifyVolumeMounted()
        // R194 — 页面在后台/熄屏时不是冻结的：计时器被降频，JS 照跑。以前这里只发通知、等用户回来
        // 才补发事件，于是「插上盘、锁屏、过一会儿打开」看到的还是旧列表。现在同一个事件立刻交给页面，
        // 它会在后台把扫描跑完（扫描自己有前台服务兜着）；页面跑到就回 `volumeHandled`，回前台时
        // flushPendingVolume 就不会再扫第二遍。
        deliverVolumeEvent("mounted", teslaPath)
    }

    private fun deliverVolumeEvent(kind: String, path: String) {
        val view = webView ?: return
        volumeDeliveries += 1
        view.post {
            view.evaluateJavascript(
                "try{window.__tdashcamVolumeEvent&&window.__tdashcamVolumeEvent(${jsonString(kind)},${jsonString(path)})}catch(e){}",
                null
            )
        }
    }

    private fun flushPendingVolume() {
        val path = pendingMountedPath ?: return
        pendingMountedPath = null
        deliverVolumeEvent("mounted", path)
    }

    /**
     * R194 — 页面已经接过这条插入事件。后台那次投递成功时它会在后台就把扫描跑起来，回前台不该再来一遍。
     */
    fun clearPendingVolume(path: String) {
        volumeAcks += 1
        if (pendingMountedPath == path) pendingMountedPath = null
    }

    /** R196 — 插盘链路的原生半边，原样进诊断。 */
    fun volumeStats(): String {
        val age = if (lastVolumeAtMs == 0L) "-"
        else "${(android.os.SystemClock.elapsedRealtime() - lastVolumeAtMs) / 1000}s"
        return "rx=$volumeRx tesla=$volumeTesla deliver=$volumeDeliveries ack=$volumeAcks" +
            " last=${lastVolumeAction.ifEmpty { "-" }}@$age page=$pageVisible"
    }

    private fun notifyVolumeMounted() {
        val zh = uiLanguage() == "zh"
        val manager = NotificationManagerCompat.from(this)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val system = getSystemService(NotificationManager::class.java)
            if (system != null && system.getNotificationChannel(STORAGE_CHANNEL) == null) {
                system.createNotificationChannel(
                    NotificationChannel(STORAGE_CHANNEL, if (zh) "存储卡" else "Storage",
                        NotificationManager.IMPORTANCE_DEFAULT).apply { setShowBadge(true) }
                )
            }
        }
        val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return
        val pending = PendingIntent.getActivity(
            this, 2, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val notification = NotificationCompat.Builder(this, STORAGE_CHANNEL)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentTitle(if (zh) "存储卡已接入" else "Storage plugged in")
            .setContentText(if (zh) "点按打开「特写」，扫描这块盘" else "Tap to open Tessera and scan it")
            .setContentIntent(pending)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        runCatching { manager.notify(STORAGE_NOTIFICATION_ID, notification) }
    }

    /**
     * R192 — the page's language, so a notification raised while it is asleep still speaks it. Read
     * only when there is no page to ask; the page pushes it on every language change.
     */
    private fun uiLanguage(): String =
        getSharedPreferences("tessera", MODE_PRIVATE).getString(KEY_UI_LANG, null) ?: "zh"

    fun applyUiLanguage(lang: String) {
        if (lang != "zh" && lang != "en") return
        val prefs = getSharedPreferences("tessera", MODE_PRIVATE)
        if (prefs.getString(KEY_UI_LANG, null) == lang) return
        prefs.edit().putString(KEY_UI_LANG, lang).apply()
    }

    /**
     * Delete the files that make up one event. `MANAGE_EXTERNAL_STORAGE` is already granted — the
     * whole design rests on reading a dashcam stick by absolute path — so `File.delete()` is the
     * short route, and the alternative is sending people into a file manager to hunt for
     * `SavedClips/2024-05-06_19-33-34`.
     *
     * Everything is validated before anything is removed, because a half-deleted event is worse
     * than a refused request. Each path must be an existing file, contain no `..`, and sit either
     * under a `TeslaCam` folder or inside a folder named like one event (`2024-05-06_19-33-34`),
     * which is the shape a stick mounted with `SavedClips` at its root has. Directories are refused
     * outright, so no amount of path cleverness reaches `TeslaCam` itself or the volume above it.
     * An event folder this delete emptied is removed too — a stray empty directory reads as "the
     * clip is still there" on the car's own playback screen.
     */
    fun deletePathsJson(payload: String): String {
        val names = runCatching { JSONArray(payload) }.getOrElse {
            return """{"ok":false,"error":${jsonString("无法解析删除请求")}}"""
        }
        if (names.length() == 0) {
            return """{"ok":false,"error":${jsonString("没有可删除的文件")}}"""
        }
        val files = ArrayList<File>(names.length())
        val missing = ArrayList<String>()
        val seen = HashSet<String>(names.length())
        for (i in 0 until names.length()) {
            val path = names.optString(i)
            if (path.isEmpty()) {
                return """{"ok":false,"error":${jsonString("路径为空")}}"""
            }
            val folder = path.substringBeforeLast('/', "").substringAfterLast('/')
            if (path.contains("..") || (!path.contains("/TeslaCam/") && !EVENT_FOLDER.containsMatchIn(folder))) {
                return """{"ok":false,"error":${jsonString("不属于某个事件目录，已拒绝：" + path)}}"""
            }
            // 同一条路径出现两次（多批勾选、列表重叠）时第二次必然 unlink 失败，而失败会让整批
            // 结果变成「删除失败」—— 明明东西已经删掉了。
            if (!seen.add(path)) continue
            val file = File(path)
            if (!file.isFile) {
                // R188 · 不存在＝已经不在，跳过，是否掉整批。扫描到删除之间被外部删掉、或这一片
                // 本来就没有 thumb.png 都算这一类；一条缺失让「删 20 个事件」全失败，用户只会看到
                // 「删除失败」。安全性判定（..、必须在 TeslaCam 或事件目录下）仍然一票否决。
                missing.add(path)
                continue
            }
            files.add(file)
        }
        if (files.isEmpty()) {
            // 全都是「已经在磁盘上不存在」：对列表来说这就是删成功了，只是没腾出空间。
            return """{"ok":true,"deleted":0,"freed":0,"deletedPaths":[],"alreadyGone":${missing.size}}"""
        }
        var freed = 0L
        val failed = ArrayList<String>()
        val deletedPaths = ArrayList<String>(files.size)
        val parents = LinkedHashSet<File>()
        for (file in files) {
            // R85: `length()` after a *failed* unlink still reports the size of the file that is
            // sitting there, so the old "freed" number counted files that were never deleted.
            if (file.delete()) {
                freed += file.length()
                deletedPaths.add(file.path)
                file.parentFile?.let { parents.add(it) }
            } else {
                failed.add(file.name)
            }
        }
        parents.forEach { dir ->
            runCatching { if (dir.isDirectory && dir.list()?.isEmpty() == true) dir.delete() }
        }
        val deletedJson = deletedPaths.joinToString(",", "[", "]") { jsonString(it) }
        if (failed.isNotEmpty()) {
            return """{"ok":false,"error":${jsonString("删除失败：" + failed.joinToString(","))},""" +
                """"deleted":${deletedPaths.size},"freed":$freed,"deletedPaths":$deletedJson}"""
        }
        return """{"ok":true,"deleted":${files.size},"freed":$freed,"deletedPaths":$deletedJson}"""
    }

    /**
     * Run a delete on the worker. The synchronous version was the same freeze as the volume listing
     * with a different name: a dozen `File.delete()` calls plus an emptiness check on a stick behind
     * FUSE is seconds during which the page cannot answer anything — including the tap on the button
     * the user was already nervous about pressing.
     */
    fun requestDelete(payloadJson: String) {
        volumeExecutor.execute { publishDeleteResult(deletePathsJson(payloadJson)) }
    }

    private fun publishDeleteResult(payload: String) {
        val view = webView ?: return
        view.post {
            view.evaluateJavascript(
                "try{window.__tdashcamDeleteResult&&window.__tdashcamDeleteResult($payload)}catch(e){}",
                null
            )
        }
    }


    /**
     * The device facts the About page and a bug report are built from, as JSON. Kept apart from the
     * push so the page can also ask for them: on a cold start every `pushState()` lands while the
     * WebView is still navigating, and the only value JS can then read is the localStorage cache —
     * which was written by whichever version ran last and reports the wrong number.
     */
    internal fun stateJson(): String {
        val manage = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Environment.isExternalStorageManager()
        } else {
            // API 24–29 没有 MANAGE_EXTERNAL_STORAGE：诚实的答案是有没有拿到运行时
            // READ_EXTERNAL_STORAGE。以前这里硬写 true，安卓 7–10 上扫不出文件、权限横幅也不出现。
            checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED
        }
        val legacy = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            Environment.isExternalStorageLegacy()
        } else {
            true
        }
        val night = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
            Configuration.UI_MODE_NIGHT_YES
        // Which handset this is belongs on the About page and in a bug report: "the plate is cut
        // off" means something different on a Xiaomi tablet running 13 than on a Pixel phone.
        val device = listOf(Build.MANUFACTURER, Build.MODEL)
            .filter { !it.isNullOrBlank() }
            .joinToString(" ")
        val json = """{"manage_external_storage":$manage,"legacy_storage":$legacy,"sdk":${Build.VERSION.SDK_INT},""" +
            """"night":$night,"high_contrast":${highTextContrastEnabled()},""" +
            """"reduce_transparency":${reduceTransparencyEnabled()},""" +
            """"version":"$appVersionName","device":${jsonString(device)},""" +
            """"export_dir":${jsonString(downloadDir())},""" +
            """"android":${jsonString(Build.VERSION.RELEASE ?: "")}}"""
        return json
    }

    /**
     * Either source, because they are not the same answer. On API 36 the accessor reported `false`
     * with 「高对比度文本」 on, while the row the switch writes (`accessibility_high_text_contrast_enabled`)
     * read `1` — so the row alone would work on the emulator and the accessor alone would not, and an
     * OEM ROM that keeps its switch somewhere else is exactly the case the accessor covers. Failing
     * toward "more contrast" is the safe direction of the two.
     */
    private fun highTextContrastEnabled(): Boolean {
        if (readSecureFlag(KEY_HIGH_TEXT_CONTRAST)) return true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            val manager = getSystemService(AccessibilityManager::class.java) ?: return false
            return runCatching { manager.isHighContrastTextEnabled }.getOrDefault(false)
        }
        return false
    }

    private fun reduceTransparencyEnabled(): Boolean = readGlobalFlag(KEY_REDUCE_TRANSPARENCY)

    private fun readSecureFlag(key: String): Boolean =
        runCatching { Settings.Secure.getString(contentResolver, key) }.getOrNull() == "1"

    private fun readGlobalFlag(key: String): Boolean =
        runCatching { Settings.Global.getString(contentResolver, key) }.getOrNull() == "1"

    /**
     * Queue a state push for the end of the current message.
     *
     * Never call [pushState] straight from a window callback. The first `evaluateJavascript` of a
     * process hands the script to a browser process that is still starting up, and until it answers
     * the UI thread sits in native code — during the very first insets dispatch that is longer than
     * the five-second input timeout, which is how a cold start produced 「特写 isn't responding」.
     * Deferring past the traversal lets that startup finish, and the page cannot be listening
     * before it anyway.
     *
     * Coalesced because insets arrive in bursts (rotation, keyboard, fullscreen) and one push
     * carries everything.
     */
    private fun scheduleStatePush() {
        if (pushScheduled) return
        pushScheduled = true
        window.decorView.post {
            pushScheduled = false
            pushState()
        }
    }

    /** Called from the page once its viewer exists; see [scheduleStatePush]. */
    fun onPageReady() {
        // A `@JavascriptInterface` call arrives on the WebView's bridge thread; the flag and the
        // posted push both belong to the UI thread.
        runOnUiThread {
            // 页面自己的 ready 永远是「现在这个文档」发出的。2.5s 那个定时器可能落在旧文档上、
            // 被导航丢掉，而它已经把 flag 置真 —— 再早退就等于这一次真信号也不算数，安全区永不到。
            pageReady = true
            scheduleStatePush()
        }
    }

    private fun pushState() {
        val view = webView ?: return
        // Anything before the page is listening is dropped by the navigation that follows, and
        // asking a starting WebView to run it is what blocked the UI thread.
        if (!pageReady) return
        // R85: `stateJson()` is not a string template — it mkdirs the export directory on external
        // storage (seconds behind FUSE on a stick) and reads two Settings providers over Binder. This
        // ran on the UI thread on *every* insets dispatch: rotation, keyboard show/hide, fullscreen
        // toggle, window focus, configuration change. R38 deferred the first push so a starting
        // WebView could not block the thread; the work inside it was never moved off it.
        val declarations = insetDeclarations
        stateExecutor.execute {
            val json = runCatching { stateJson() }.getOrDefault("{}")
            view.post { deliverState(json, declarations) }
        }
    }

    private fun deliverState(json: String, declarations: String) {
        val view = webView ?: return
        val js = buildString {
            if (declarations.isNotEmpty()) {
                append("(function(s){").append(declarations).append("})(document.documentElement.style);")
            }
            append("window.__tdashcamStorage=$json;")
            // The page cannot watch a plain assignment, so it gets an explicit call. This is
            // how a night-mode flip reaches JS while the app is already in the foreground.
            append("try{window.__tdashcamNativeState&&window.__tdashcamNativeState()}catch(e){}")
            // localStorage survives a reload, so a later page can still read the flag even
            // if the next push has not landed yet.
            append("try{localStorage.setItem('__tdashcam_storage',JSON.stringify(window.__tdashcamStorage))}catch(e){}")
        }
        view.evaluateJavascript(js, null)
    }
}

/**
 * The page's side of [MainActivity]: it owns which overlays are open, so it tells the activity
 * how many of them back should swallow, and which way the system bar icons have to read.
 * Reachable from JS as `window.TDashcamNative`.
 */
class NativeBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun pageReady() {
        activity.onPageReady()
    }

    @JavascriptInterface
    fun setBackLayers(count: Int) {
        activity.onBackLayersChanged(count)
    }

    @JavascriptInterface
    fun setLightSystemBars(light: Boolean) {
        activity.applyBarAppearance(light)
    }

    @JavascriptInterface
    fun openStorageSettings() {
        activity.openStorageSettings()
    }

    /**
     * The app's own external folder, quoted in the permission hint as the one place a file manager
     * cannot get wrong. Cheap enough to answer synchronously (one mkdir plus a stat) and only
     * called on a tap, unlike the volume poll beside it.
     */
    @JavascriptInterface
    fun appFilesDir(): String = activity.appFilesDir()

    /**
     * Mounted storages plus the count of attached USB devices, as JSON. A stick that is electrically
     * present but not mounted is the single most common "I plugged it in and nothing happened" on a
     * tablet, and only the framework can tell those two apart.
     */
    @JavascriptInterface
    fun storageVolumes(): String = activity.storageVolumesJson()

    /**
     * Directory counts for the volumes, answered later through `__tdashcamVolumeCounts`. Split out of
     * `storageVolumes()` because a synchronous bridge call parks the page's JS thread until it
     * returns, and the listing it does is the slow part.
     */
    @JavascriptInterface
    fun requestVolumeCounts() {
        activity.requestVolumeCounts()
    }

    /**
     * The same device state `pushState()` posts, for a page that renders before any push arrives.
     * Runs on the WebView's JS thread, which is why it is synchronous and cheap.
     */
    @JavascriptInterface
    fun nativeStatus(): String = activity.stateJson()

    @JavascriptInterface
    fun openExternal(url: String) {
        activity.openExternal(url)
    }

    /** Send one exported clip to another app. Answers `ok` or a reason the page has words for. */
    @JavascriptInterface
    fun shareFile(path: String, title: String): String = activity.shareFile(path, title)

    /** Remove the files of one event. Answers later through `__tdashcamDeleteResult`. */
    @JavascriptInterface
    fun deletePaths(payloadJson: String) {
        activity.requestDelete(payloadJson)
    }

    @JavascriptInterface
    fun setKeepScreenOn(keep: Boolean) {
        activity.applyKeepScreenOn(keep)
    }

    /** `loss` / `transient` / `gain` come back as `window.__tdashcamAudioFocus(kind)`. */
    @JavascriptInterface
    fun setAudioFocus(active: Boolean) {
        activity.applyAudioFocus(active)
    }

    /** Named taps — see [applyHaptic] for why they are not millisecond patterns. */
    @JavascriptInterface
    fun vibrate(kind: String) {
        activity.applyHaptic(kind)
    }

    /** R194 — the page took the mount event that was delivered while it was in the background. */
    @JavascriptInterface
    fun volumeHandled(path: String) {
        activity.clearPendingVolume(path)
    }

    /** R196 — where the plug-in chain stopped, for the copyable diagnostics. */
    @JavascriptInterface
    fun volumeStats(): String = activity.volumeStats()

    /**
     * R192 — keep the process awake while a scan runs. `text` is the notification's second line,
     * supplied by the page because the words have to match the language the user is reading.
     */
    @JavascriptInterface
    fun scanKeepAlive(active: Boolean, text: String) {
        activity.setScanKeepAlive(active, text)
    }

    /** R192 — the page's language, for notifications raised while it is asleep. */
    @JavascriptInterface
    fun setUiLang(lang: String) {
        activity.applyUiLanguage(lang)
    }

    @JavascriptInterface
    fun setFullscreen(fullscreen: Boolean) {
        activity.applyFullscreen(fullscreen)
    }

    @JavascriptInterface
    fun systemBrightness(): String = activity.systemBrightnessFraction()

    /**
     * How far above the system slider this window wants the panel, 0..1 of the headroom; negative
     * releases it. The page sends a ratio rather than an absolute level because the level it is
     * added to keeps moving — see [applyScreenBoost].
     */
    @JavascriptInterface
    fun setScreenBoost(value: Double) {
        activity.applyScreenBoost(value.toFloat())
    }

    /**
     * A snapshot written into Download stays invisible to the gallery until MediaStore hears
     * about it; the app never goes through a ContentUris insert, so the scanner does.
     */
    @JavascriptInterface
    fun scanMediaFile(path: String) {
        activity.runOnUiThread {
            MediaScannerConnection.scanFile(activity.applicationContext, arrayOf(path), null, null)
        }
    }

    /**
     * Start a clip export. Returns `{"id":-1}` when the description is unusable or a job is already
     * running, so the page never sits on a progress bar that will never move.
     */
    @JavascriptInterface
    fun startExport(requestJson: String): String = activity.beginExport(requestJson)

    @JavascriptInterface
    fun cancelExport(id: Long) {
        activity.cancelExport(id)
    }

    /**
     * What the export is doing right now: `{"running":bool,"delivered":bool,"payload":{…}}`, with
     * the payload in the same shape a live progress report arrives in. This is how a page that
     * reloaded — or simply sat in a pocket for four minutes — rejoins a job it did not see start.
     */
    @JavascriptInterface
    fun exportStatus(): String = activity.exportStatusJson()

    /** Says the page has already shown the finished job, so it does not announce it a second time. */
    @JavascriptInterface
    fun exportStatusSeen() {
        activity.exportStatusSeen()
    }

    /**
     * Whether the background progress can be shown at all, and the one chance to ask. A denial is
     * not a refusal to export: the job and its wake lock run regardless, the notification is just
     * invisible. Reads the real switch, so a user who turned notifications off system-wide gets an
     * honest `false` rather than a permission dialog that cannot change anything.
     */
    @JavascriptInterface
    fun notificationsAllowed(): Boolean = activity.notificationsAllowed()

    @JavascriptInterface
    fun requestNotificationPermission() {
        activity.askNotificationPermission()
    }

    /** Which decoders and encoders this device actually has, for the export panel's diagnostics. */
    @JavascriptInterface
    fun exportCodecReport(width: Int, height: Int): String = activity.exportCodecReport(width, height)

    /**
     * Every AVC codec in the list, each with whether the process can actually instantiate it.
     * Answers "the encoder refused" without another build.
     */
    @JavascriptInterface
    fun exportCodecProbe(): String = activity.exportCodecProbe()

    /**
     * One frame of one clip as a JPEG data URL, answered asynchronously through
     * `window.__tdashcamNativeThumb(id, dataUrl)`. Returns nothing: the page keeps its own
     * `<video>` seek as the fallback and fires it when the answer is null.
     */
    @JavascriptInterface
    fun requestThumb(id: String, path: String, millis: Long, width: Int) {
        activity.requestThumb(id, path, millis, width)
    }
}
