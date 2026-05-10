package com.example.carpediem.presentation.chat


data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val isLoading: Boolean = false,
    val currentInput: String = ""
)