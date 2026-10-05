package com.asunaai.asuna_mobile

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.Manifest
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val channelName = "asuna_ai/device_control"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName).setMethodCallHandler { call, result ->
            try {
                when (call.method) {
                    "toggleFlashlight" -> {
                        toggleFlashlight(call.argument<Boolean>("enabled") ?: false)
                        result.success(true)
                    }
                    "setVolume" -> {
                        setVolume(call.argument<Int>("level") ?: 50)
                        result.success(true)
                    }
                    "launchApp" -> {
                        result.success(launchApp(call.argument<String>("packageName") ?: ""))
                    }
                    "openDialer" -> {
                        startActivity(Intent(Intent.ACTION_DIAL))
                        result.success(true)
                    }
                    else -> result.notImplemented()
                }
            } catch (exception: Exception) {
                result.error("DEVICE_ACTION_FAILED", exception.message, null)
            }
        }
    }

    private fun toggleFlashlight(enabled: Boolean) {
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.CAMERA), 1001)
            throw IllegalStateException("Camera permission requested. Approve it and repeat the command.")
        }
        val manager = getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val cameraId = manager.cameraIdList.firstOrNull { id ->
            manager.getCameraCharacteristics(id).get(android.hardware.camera2.CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
        } ?: throw IllegalStateException("No flashlight is available on this device.")
        manager.setTorchMode(cameraId, enabled)
    }

    private fun setVolume(level: Int) {
        val audio = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val maximum = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        audio.setStreamVolume(AudioManager.STREAM_MUSIC, (maximum * level.coerceIn(0, 100)) / 100, 0)
    }

    private fun launchApp(packageName: String): Boolean {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: return false
        startActivity(launchIntent)
        return true
    }
}
