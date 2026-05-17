package com.example.carpediem.presentation.common


import androidx.compose.ui.graphics.Color

data class EmotionPalette(
    val background: Color,
    val card: Color,
    val accent: Color,
    val title: Color
)

fun emotionPalette(level: Int): EmotionPalette {
    return when {
        level <= 2 -> EmotionPalette(
            background = Color(0xFFFEF0EE),
            card = Color.White,
            accent = Color(0xFFE87A6A),
            title = Color(0xFF8F3A32)
        )

        level <= 4 -> EmotionPalette(
            background = Color(0xFFFEF6ED),
            card = Color.White,
            accent = Color(0xFFE8A157),
            title = Color(0xFF7A4A18)
        )

        else -> EmotionPalette(
            background = Color(0xFFF5F5DC),
            card = Color.White,
            accent = Color(0xFFB2D8B2),
            title = Color(0xFF27500A)
        )
    }
}