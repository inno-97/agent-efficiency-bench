plugins {
 id("com.android.application")
 id("org.jetbrains.kotlin.android")
 id("org.jetbrains.kotlin.plugin.compose")
 id("com.google.devtools.ksp")
}
android {
 namespace="bench.app"
 compileSdk=35
 buildToolsVersion="35.0.0"
 defaultConfig { applicationId="bench.app"; minSdk=26; targetSdk=35; versionCode=1; versionName="1.0"; testInstrumentationRunner="androidx.test.runner.AndroidJUnitRunner" }
 compileOptions { sourceCompatibility=JavaVersion.VERSION_17; targetCompatibility=JavaVersion.VERSION_17 }
 kotlinOptions { jvmTarget="17" }
 buildFeatures { compose=true }
}
dependencies {
 val bom=platform("androidx.compose:compose-bom:2025.01.01")
 implementation(bom)
 androidTestImplementation(bom)
 implementation("androidx.activity:activity-compose:1.10.1")
 implementation("androidx.compose.material3:material3")
 implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
 implementation("androidx.navigation:navigation-compose:2.8.5")
 implementation("androidx.room:room-runtime:2.7.2")
 implementation("androidx.room:room-ktx:2.7.2")
 ksp("androidx.room:room-compiler:2.7.2")
 implementation("androidx.work:work-runtime-ktx:2.10.1")
 implementation("com.squareup.retrofit2:retrofit:2.11.0")
 implementation("com.squareup.okhttp3:okhttp:4.12.0")
 androidTestImplementation("androidx.test.ext:junit:1.2.1")
 androidTestImplementation("androidx.test:runner:1.6.2")
 androidTestImplementation("androidx.compose.ui:ui-test-junit4")
 debugImplementation("androidx.compose.ui:ui-test-manifest")
}
