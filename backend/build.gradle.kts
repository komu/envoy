 plugins {
    application
    alias(libs.plugins.kotlinPluginJvm)
    alias(libs.plugins.kotlinPluginSerialization)
}

dependencies {
    implementation(libs.kotlinx.datetime)
    implementation(libs.kotlinx.serialization)
    implementation(libs.kotlinx.coroutines)
    implementation(libs.ktor.server.netty)
    implementation(libs.ktor.server.websockets)
    implementation(libs.ktor.server.callLogging)
    implementation(libs.ktor.server.defaultHeaders)
    implementation(libs.ktor.server.sessions)
    implementation(libs.anthropic)
    implementation(libs.logback.classic)
}

application {
    mainClass = "dev.komu.envoy.backend.MainKt"
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
