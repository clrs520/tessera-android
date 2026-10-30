# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
# The page calls window.TDashcamNative for back layers and system-bar tinting. R8 would
# otherwise rename the class and its methods, and the JS bridge fails silently.
-keepattributes JavascriptInterface
-keepclassmembers class com.tdashcam.studio.NativeBridge {
    @android.webkit.JavascriptInterface public *;
}
