package com.tdashcam.studio

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * R190 — 「正在扫描这块盘」的声明，让扫描在熄屏和后台也能跑完。
 *
 * 2 TB 那盘一次首扫是 walk 70 s + stat 24 s，收尾分组和侧车再来十几秒；用户经常插上盘就锁屏。
 * 普通后台进程会被 Android 12+ 的缓存冻结（MIUI 上更早），CPU 也会在熄屏后挂起 —— 两个都会让
 * 那次扫描停在半路，回来看到的就是「没扫完」。导出那条路早就有 dataSync 前台服务，扫描没有。
 *
 * 这里只做一件事：给进程一个前台身份和一条安静的常驻通知（IMPORTANCE_LOW，不响不弹），
 * 扫描一结束就 `stopService`。类型用 dataSync，与导出同一个理由：它就是在搬文件系统元数据。
 */
class ScanService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val text = intent?.getStringExtra(EXTRA_TEXT)?.takeIf { it.isNotEmpty() }
            ?: getString(R.string.app_name)
        val notification = NotificationCompat.Builder(this, ensureChannel())
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(text)
            .setOngoing(true)
            .setSilent(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            // 点通知回来看进度，而不是把用户丢在桌面。
            .setContentIntent(
                android.app.PendingIntent.getActivity(
                    this, 0,
                    packageManager.getLaunchIntentForPackage(packageName),
                    android.app.PendingIntent.FLAG_IMMUTABLE
                )
            )
            .build()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
        return START_NOT_STICKY
    }

    private fun ensureChannel(): String {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            if (manager != null && manager.getNotificationChannel(CHANNEL_ID) == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "扫描存储",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "扫描外接存储时会显示，结束后自动消失"
                    setShowBadge(false)
                    setSound(null, null)
                }
                manager.createNotificationChannel(channel)
            }
        }
        return CHANNEL_ID
    }

    companion object {
        const val CHANNEL_ID = "tessera_scan"
        const val NOTIFICATION_ID = 0x5CA9
        const val EXTRA_TEXT = "text"

        /**
         * Never throws: a page that asks from an illegal moment (background start on Android 12+,
         * no permission on a locked-down ROM) simply does not get the protection.
         */
        fun start(context: Context, text: String) {
            val intent = Intent(context, ScanService::class.java).putExtra(EXTRA_TEXT, text)
            runCatching { ContextCompat.startForegroundService(context, intent) }
        }

        fun stop(context: Context) {
            runCatching { context.stopService(Intent(context, ScanService::class.java)) }
        }
    }
}
