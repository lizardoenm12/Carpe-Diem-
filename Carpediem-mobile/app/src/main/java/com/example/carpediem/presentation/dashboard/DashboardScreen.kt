package com.example.carpediem.presentation.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.CircleShape
@Composable
fun DashboardScreen(
    onNotesClick: () -> Unit,
    onCalendarClick: () -> Unit,
    onChatClick: () -> Unit,
    onCheckInClick: () -> Unit,
    onScheduleClick: () -> Unit,
    onGamesClick: () -> Unit,
    onProfileClick: () -> Unit,
    viewModel: DashboardViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    val background = Color(0xFFF5F5DC)
    val greenButton = Color(0xFFB2D8B2)
    val greenAccent = Color(0xFFE1F5EE)
    val titleColor = Color(0xFF27500A)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (state.userName.isNotBlank()) "Hola, ${state.userName} 👋" else "Tu Espacio de Calma",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = titleColor
                    )

                    Text(
                        text = "Un día a la vez, un paso a la vez",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Gray
                    )
                }

                Surface(
                    modifier = Modifier
                        .size(48.dp)
                        .clickable { onProfileClick() },
                    shape = CircleShape,
                    color = Color.White
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text("👤")
                    }
                }
            }
        }

        item {
            DashboardCard(
                title = "⏳ El Capitán",
                subtitle = "Modo Adaptativo",
                text = state.mensajeCapitan.ifBlank {
                    "Estoy analizando tu semana para guiarte mejor hoy..."
                },
                onClick = onChatClick
            )
        }
        item {
            MiniCalendarCard(
                eventos = state.eventos,
                onCalendarClick = onCalendarClick
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SmallDashboardCard(
                    modifier = Modifier.weight(1f),
                    title = "📚 Apuntes",
                    text = if (state.totalMaterias == 0) {
                        "Crea tu primera materia"
                    } else {
                        "${state.totalMaterias} materias activas"
                    },
                    footer = state.ultimaMateria?.let { "Última: $it" } ?: "",
                    onClick = onNotesClick
                )

                SmallDashboardCard(
                    modifier = Modifier.weight(1f),
                    title = "🎮 Juegos",
                    text = "Repasa sin estrés",
                    footer = "Flashcards y ejercicios",
                    onClick = onGamesClick
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SmallDashboardCard(
                    modifier = Modifier.weight(1f),
                    title = "📅 Calendario",
                    text = if (state.eventos.isEmpty()) "Sin entregas próximas ✓" else "Próximos eventos",
                    footer = "",
                    onClick = onCalendarClick
                )

                SmallDashboardCard(
                    modifier = Modifier.weight(1f),
                    title = "🌿 Check-in",
                    text = "Actualizar emoción",
                    footer = "Ajustar sesión",
                    onClick = onCheckInClick
                )
            }
        }

        item {
            SectionHeader(
                title = "📅 Próximos eventos",
                actionText = "Ver calendario",
                onActionClick = onCalendarClick
            )
        }

        if (state.eventos.isEmpty()) {
            item {
                EmptyCard("Sin entregas próximas ✓")
            }
        } else {
            items(state.eventos) { event ->
                EventRow(event)
            }
        }

        item {
            SectionHeader(
                title = "🗓️ Tu día de hoy",
                actionText = "Editar horario",
                onActionClick = onScheduleClick
            )
        }

        if (state.actividadesHoy.isEmpty()) {
            item {
                EmptyCard("No tienes actividades para hoy")
            }
        } else {
            items(state.actividadesHoy) { activity ->
                ActivityRow(activity)
            }
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun DashboardCard(
    title: String,
    subtitle: String,
    text: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(title, color = Color.Gray, style = MaterialTheme.typography.bodySmall)

                Text(
                    subtitle,
                    color = Color(0xFF7DBF9E),
                    style = MaterialTheme.typography.labelSmall
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = text,
                color = Color(0xFF444444),
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun SmallDashboardCard(
    modifier: Modifier = Modifier,
    title: String,
    text: String,
    footer: String,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .height(130.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(title, color = Color.Gray, style = MaterialTheme.typography.bodySmall)

            Column {
                Text(
                    text,
                    color = Color(0xFF333333),
                    fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.bodyMedium
                )

                if (footer.isNotBlank()) {
                    Text(
                        footer,
                        color = Color.Gray,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    actionText: String,
    onActionClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            title,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF27500A)
        )

        Text(
            text = actionText,
            color = Color(0xFF7DBF9E),
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.clickable { onActionClick() }
        )
    }
}

@Composable
private fun EventRow(event: DashboardEvent) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "●",
                color = Color(0xFFE8A157),
                modifier = Modifier.padding(end = 10.dp)
            )

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = event.titulo,
                    color = Color(0xFF333333),
                    fontWeight = FontWeight.Medium
                )

                Text(
                    text = event.fechaTexto,
                    color = Color.Gray,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun ActivityRow(activity: DashboardActivity) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = getActivityEmoji(activity.tipo),
                modifier = Modifier.padding(end = 12.dp)
            )

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = activity.nombre,
                    color = Color(0xFF333333),
                    fontWeight = FontWeight.Medium
                )

                Text(
                    text = "${activity.horaInicio} – ${activity.horaFin}",
                    color = Color.Gray,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun EmptyCard(text: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(20.dp),
            color = Color.Gray
        )
    }
}

private fun getActivityEmoji(tipo: String): String {
    return when (tipo) {
        "clase" -> "📖"
        "estudio" -> "✏️"
        "trabajo" -> "💼"
        "descanso" -> "🌿"
        "personal" -> "🌟"
        "ejercicio" -> "🏃"
        else -> "📌"
    }
}