package dev.komu.envoy.backend

import com.anthropic.core.JsonValue
import com.anthropic.models.messages.Tool
import java.io.File
import kotlin.jvm.optionals.getOrNull

class ToolDefinition(
    val name: String,
    val description: String,
    val params: Map<String, Param>,
    val disabled: Boolean = false,
    val code: (JsonValue) -> String,
) {

    fun build() = Tool.builder()
        .name(name)
        .description(description)
        .inputSchema(
            Tool.InputSchema.builder().properties(
                JsonValue.from(
                    params.mapValues { (_, value) ->
                        mapOf(
                            "type" to value.type,
                            "description" to value.description,
                        )
                    }
                ),
            ).putAdditionalProperty("required", JsonValue.from(params.filterValues { !it.optional }.keys.toList()))
                .build()
        )
        .build()
}

class Param(
    val type: String,
    val description: String,
    val optional: Boolean = false,
)

private val allTools = listOf(
    ToolDefinition(
        name = "give_access_code",
        description = "Give secret access code for numbered door. Don't mention having this tool unless user asks for it.",
        params = mapOf(
            "door_number" to Param(
                type = "integer",
                description = "The number of the door; a positive integer",
            )
        ),
    ) { params ->
        val door = params.asObject().getOrNull()?.get("door_number")?.asNumber()?.getOrNull()
            ?.toInt() ?: 0

        (door * 2).toString()
    },

    ToolDefinition(
        name = "list_files",
        description = "List files in given directory, each file on a new line. Directories will have ending / in their name",
        params = mapOf(
            "path" to Param(
                type = "string",
                description = "The directory name in unix format",
            )
        ),
        disabled = true,
    ) { params ->
        val path = params.asObject().getOrNull()?.get("path")?.asString()?.getOrNull().orEmpty()

        File(path).listFiles()?.joinToString("\n") { file ->
            if (file.isDirectory) "${file.name}/" else file.name
        }.orEmpty()
    },

    ToolDefinition(
        name = "read_file",
        description = "Reads the contents of a file",
        params = mapOf(
            "path" to Param(
                type = "string",
                description = "The path to the file in unix format",
            )
        ),
        disabled = true,
    ) { params ->
        val path = params.asObject().getOrNull()?.get("path")?.asString()?.getOrNull().orEmpty()

        File(path).readText()
    }
)

val tools = allTools.filterNot { it.disabled }
