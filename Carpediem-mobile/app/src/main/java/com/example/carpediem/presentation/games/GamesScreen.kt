package com.example.carpediem.presentation.games

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.carpediem.ui.theme.EmotionColorManager
import com.example.carpediem.ui.theme.emotionAccentColor
import com.example.carpediem.ui.theme.emotionBackgroundColor
import com.example.carpediem.ui.theme.emotionCardColor

data class GameItem(
    val id: String,
    val emoji: String,
    val title: String,
    val description: String,
    val available: Boolean
)

private val games = listOf(
    GameItem("flashcards", "🃏", "Flashcards", "La IA genera tarjetas de repaso desde los temas de tu materia.", true),
    GameItem("crossword", "🔤", "Crucigrama", "Próximamente: crucigrama con conceptos clave de tus apuntes.", false),
    GameItem("trivia", "⚡", "Trivia rápida", "Próximamente: responde preguntas rápidas antes de un examen.", false)
)

@Composable
fun GamesScreen(
    onFlashcardsClick: () -> Unit
) {
    val nivel by EmotionColorManager.nivelEmocion.collectAsState()
    val background = emotionBackgroundColor(nivel)
    val cardColor = emotionCardColor(nivel)
    val accentColor = emotionAccentColor(nivel)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "🎮 Juegos",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF27500A)
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Aprende jugando y repasa sin tanta presión.",
                color = Color.Gray,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        games.forEach { game ->
            item {
                GameCard(
                    game = game,
                    cardColor = cardColor,
                    accentColor = accentColor,
                    onClick = {
                        if (game.id == "flashcards" && game.available) {
                            onFlashcardsClick()
                        }
                    }
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
private fun GameCard(
    game: GameItem,
    cardColor: Color,
    accentColor: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = game.available) { onClick() },
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(
            containerColor = cardColor.copy(
                alpha = if (game.available) 1f else 0.65f
            )
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = game.emoji,
                    style = MaterialTheme.typography.headlineMedium
                )

                Surface(
                    color = if (game.available) accentColor.copy(alpha = 0.45f) else Color(0xFFF0F0E8),
                    shape = RoundedCornerShape(50)
                ) {
                    Text(
                        text = if (game.available) "Disponible" else "Próximamente",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        color = if (game.available) Color(0xFF27500A) else Color.Gray,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = game.title,
                color = Color(0xFF27500A),
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleMedium
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = game.description,
                color = Color.Gray,
                style = MaterialTheme.typography.bodyMedium
            )

            if (game.available) {
                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Jugar →",
                    color = Color(0xFF27500A),
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}