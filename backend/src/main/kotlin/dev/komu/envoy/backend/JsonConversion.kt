package dev.komu.envoy.backend

import com.anthropic.core.JsonValue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

private val prettyPrintFormat = Json { prettyPrint = true }

fun JsonValue.prettyPrint() = prettyPrintFormat.encodeToString(JsonElement.serializer(), convertJson())

fun JsonValue.convertJson(): JsonElement = accept(object : JsonValue.Visitor<JsonElement> {
    override fun visitNull() = JsonNull
    override fun visitBoolean(value: Boolean) = JsonPrimitive(value)
    override fun visitNumber(value: Number) = JsonPrimitive(value)
    override fun visitString(value: String) = JsonPrimitive(value)
    override fun visitObject(values: Map<String, JsonValue>) = JsonObject(values.mapValues { (_, value) -> value.convertJson() })
    override fun visitArray(values: List<JsonValue>) = JsonArray(values.map { it.convertJson() })
})
