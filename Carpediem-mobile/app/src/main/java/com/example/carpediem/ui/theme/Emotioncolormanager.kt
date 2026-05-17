package com.example.carpediem.ui.theme

import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

object EmotionColorManager {

    private val _nivelEmocion = MutableStateFlow(5)
    val nivelEmocion: StateFlow<Int> = _nivelEmocion

    fun setNivel(value: Int) {
        _nivelEmocion.value = value
    }
}

fun emotionBackgroundColor(nivel: Int): Color {
    return when {
        nivel <= 2 -> Color(0xFFFFE5E5)
        nivel <= 4 -> Color(0xFFFFF4D6)
        else -> Color(0xFFF5F5DC)
    }
}

fun emotionCardColor(nivel: Int): Color {
    return when {
        nivel <= 2 -> Color(0xFFFFF1F1)
        nivel <= 4 -> Color(0xFFFFFAE8)
        else -> Color.White
    }
}

fun emotionAccentColor(nivel: Int): Color {
    return when {
        nivel <= 2 -> Color(0xFFE7A1A1)
        nivel <= 4 -> Color(0xFFE8D28A)
        else -> Color(0xFFB2D8B2)
    }
}

fun emotionBorderColor(nivel: Int): Color {
    return when {
        nivel <= 2 -> Color(0xFFE7A1A1)
        nivel <= 4 -> Color(0xFFE8D28A)
        else -> Color(0xFFB2D8B2)
    }
}

fun emotionHexColor(nivel: Int): String {
    return when {
        nivel <= 2 -> "#FFE5E5"
        nivel <= 4 -> "#FFF4D6"
        else -> "#F5F5DC"
    }
}