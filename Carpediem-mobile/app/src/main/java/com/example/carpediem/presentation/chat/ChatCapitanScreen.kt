package com.example.carpediem.presentation.chat

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.carpediem.ui.theme.EmotionColorManager
import com.example.carpediem.ui.theme.emotionBackgroundColor
import com.example.carpediem.ui.theme.emotionBorderColor
import com.example.carpediem.ui.theme.emotionAccentColor
@Composable
fun ChatCapitanScreen(
    viewModel: ChatCapitanViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val subjects by viewModel.subjects.collectAsState()
    val emotionLevel by EmotionColorManager.nivelEmocion.collectAsState()
    val savingChat by viewModel.savingChat.collectAsState()


    var showSaveDialog by remember { mutableStateOf(false) }

    val listState = rememberLazyListState()
    val background = emotionBackgroundColor(emotionLevel)
    val borderColor = emotionBorderColor(emotionLevel)
    val accentColor = emotionAccentColor(emotionLevel)

    LaunchedEffect(state.messages.size, state.isLoading) {
        if (state.messages.isNotEmpty()) {
            listState.animateScrollToItem(state.messages.lastIndex)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
    ) {
        HeaderCapitan()

        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            items(state.messages) { message ->
                MessageBubble(
                    message = message,
                    borderColor = borderColor
                )
            }

            if (state.isLoading) {
                item {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("⏳")
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "El Capitán está pensando...",
                            color = Color.Gray
                        )
                    }
                }
            }
        }

        InputBar(
            value = state.currentInput,
            loading = state.isLoading,
            accentColor = accentColor,
            onValueChange = viewModel::updateInput,
            onSend = viewModel::sendMessage,
            onSave = {
                viewModel.loadSubjects()
                showSaveDialog = true
            }
        )
    }

    if (showSaveDialog) {
        SaveChatDialog(
            subjects = subjects,
            saving = savingChat,
            onDismiss = { showSaveDialog = false },
            onSelect = { subject ->
                viewModel.saveChatToSubject(
                    subjectId = subject.id,
                    subjectName = subject.name,
                    onDone = {
                        showSaveDialog = false
                    }
                )
            }
        )
    }
}

@Composable
private fun HeaderCapitan() {
    Surface(
        color = Color.White.copy(alpha = 0.78f),
        tonalElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(44.dp),
                shape = RoundedCornerShape(14.dp),
                color = Color(0xFFE1F5EE)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text("⏳")
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column {
                Text(
                    text = "El Capitán",
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF27500A)
                )

                Text(
                    text = "Tu tutor de estudio · Carpe Diem",
                    color = Color.Gray,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun MessageBubble(
    message: ChatMessage,
    borderColor: Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (message.isUser) Arrangement.End else Arrangement.Start
    ) {
        if (!message.isUser) {
            Text(
                text = "⏳",
                modifier = Modifier.padding(end = 8.dp, top = 8.dp)
            )
        }

        Surface(
            modifier = Modifier.widthIn(max = 280.dp),
            shape = RoundedCornerShape(
                topStart = 18.dp,
                topEnd = 18.dp,
                bottomStart = if (message.isUser) 18.dp else 4.dp,
                bottomEnd = if (message.isUser) 4.dp else 18.dp
            ),
            color = if (message.isUser) Color(0xFFB2D8B2) else Color.White,
            border = if (!message.isUser) BorderStroke(0.5.dp, borderColor) else null
        ) {
            Text(
                text = message.text,
                modifier = Modifier.padding(14.dp),
                color = Color(0xFF333333),
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun InputBar(
    value: String,
    loading: Boolean,
    accentColor: Color,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    onSave: () -> Unit
) {
    Surface(
        color = Color.White,
        tonalElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text("¡Oh Capitán, mi Capitán!...")
                },
                shape = RoundedCornerShape(16.dp),
                singleLine = false,
                maxLines = 3
            )

            Spacer(modifier = Modifier.width(8.dp))

            IconButton(
                onClick = onSave,
                enabled = !loading
            ) {
                Icon(
                    imageVector = Icons.Default.Save,
                    contentDescription = "Guardar chat",
                    tint = Color(0xFF27500A)
                )
            }

            FloatingActionButton(
                onClick = onSend,
                containerColor = if (value.isNotBlank() && !loading) {
                    accentColor
                } else {
                    Color(0xFFE6ECF3)
                },
                contentColor = Color(0xFF27500A),
                modifier = Modifier.size(48.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Enviar"
                )
            }
        }
    }
}

@Composable
private fun SaveChatDialog(
    subjects: List<SubjectOption>,
    saving: Boolean,
    onDismiss: () -> Unit,
    onSelect: (SubjectOption) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Guardar conversación",
                color = Color(0xFF27500A),
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column {
                if (subjects.isEmpty()) {
                    Text(
                        text = "No tienes materias creadas todavía.",
                        color = Color.Gray
                    )
                } else {
                    subjects.forEach { subject ->
                        Text(
                            text = "📚 ${subject.name}",
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(enabled = !saving) {
                                    onSelect(subject)
                                }
                                .padding(vertical = 12.dp),
                            color = Color(0xFF333333)
                        )
                    }
                }

                if (saving) {
                    Spacer(modifier = Modifier.height(12.dp))
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp
                    )
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}
