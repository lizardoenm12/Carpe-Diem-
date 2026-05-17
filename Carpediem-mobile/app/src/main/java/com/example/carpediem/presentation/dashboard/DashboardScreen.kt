package com.example.carpediem.presentation.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun DashboardScreen(
    refreshKey: Long = 0L,
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

    // ── Observar el color global en tiempo real ───────────────────────────────
    val nivelGlobal by EmotionColorManager.nivelEmocion.collectAsState()
    val background  = emotionBackgroundColor(nivelGlobal)
    val borderColor = emotionBorderColor(nivelGlobal)

    LaunchedEffect(refreshKey) { viewModel.loadDashboard() }

    val titleColor = Color(0xFF27500A)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // ── Header ────────────────────────────────────────────────────────────
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (state.userName.isNotBlank()) "Hola, ${state.userName} 👋"
                        else "Tu Espacio de Calma",
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
                    modifier = Modifier.size(48.dp).clickable { onProfileClick() },
                    shape = CircleShape,
                    color = Color.White
                ) {
                    Box(contentAlignment = Alignment.Center) { Text("👤") }
                }
            }
        }

        // ── Card El Capitán (color dinámico) ──────────────────────────────────
        item {
            Card(
                modifier = Modifier.fillMaxWidth().clickable { onChatClick() },
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = background),
                border = androidx.compose.foundation.BorderStroke(1.dp, borderColor)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("⏳ El Capitán", color = titleColor, fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.bodyMedium)
                        Text("Estado: ${state.nivelEmocion}/6", color = titleColor,
                            style = MaterialTheme.typography.labelSmall)
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = state.mensajeCapitan.ifBlank { "Estoy analizando tu día..." },
                        color = Color(0xFF333333),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }

        item {
            MiniCalendarCard(
                eventos = state.eventos,
                onCalendarClick = onCalendarClick
            )
        }

        // ── Cards pequeñas fila 1 ─────────────────────────────────────────────
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                SmallDashboardCard(
                    modifier    = Modifier.weight(1f),
                    title       = "📚 Apuntes",
                    text        = if (state.totalMaterias == 0) "Crea tu primera materia"
                    else "${state.totalMaterias} materias activas",
                    footer      = state.ultimaMateria?.let { "Última: $it" } ?: "",
                    borderColor = borderColor,
                    onClick     = onNotesClick
                )
                SmallDashboardCard(
                    modifier    = Modifier.weight(1f),
                    title       = "🎮 Juegos",
                    text        = "Repasa sin estrés",
                    footer      = "Flashcards",
                    borderColor = borderColor,
                    onClick     = onGamesClick
                )
            }
        }

        // ── Cards pequeñas fila 2 ─────────────────────────────────────────────
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                SmallDashboardCard(
                    modifier    = Modifier.weight(1f),
                    title       = "📅 Agenda",
                    text        = if (state.eventos.isEmpty()) "Sin entregas próximas"
                    else "Próximos eventos",
                    footer      = "",
                    borderColor = borderColor,
                    onClick     = onCalendarClick
                )
                // ── Botón Check-in con color dinámico ─────────────────────────
                Card(
                    modifier = Modifier.weight(1f).height(135.dp).clickable { onCheckInClick() },
                    shape    = RoundedCornerShape(20.dp),
                    colors   = CardDefaults.cardColors(containerColor = background),
                    border   = androidx.compose.foundation.BorderStroke(1.5.dp, borderColor)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize().padding(14.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("🌿 Check-in", color = Color.Gray,
                            style = MaterialTheme.typography.bodySmall)
                        Column {
                            Text("Actualizar emoción", color = titleColor,
                                fontWeight = FontWeight.SemiBold,
                                style = MaterialTheme.typography.bodyMedium)
                            Text("Adaptar sesión", color = Color.Gray,
                                style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }

        // ── Próximos eventos ──────────────────────────────────────────────────
        item {
            SectionHeader(
                title = "📅 Próximos eventos",
                actionText = "Ver agenda",
                onActionClick = onCalendarClick
            )
        }

        if (state.eventos.isEmpty()) {
            item { EmptyCard("Sin entregas próximas ✨") }
        } else {
            items(state.eventos) { event -> EventRow(event, borderColor) }
        }

        // ── Tu día de hoy ─────────────────────────────────────────────────────
        item {
            SectionHeader(
                title = "🗓️ Tu día de hoy",
                actionText = "Editar horario",
                onActionClick = onScheduleClick
            )
        }

        if (state.actividadesHoy.isEmpty()) {
            item { EmptyCard("No tienes actividades para hoy") }
        } else {
            items(state.actividadesHoy) { activity -> ActivityRow(activity) }
        }

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

// ── Componentes ───────────────────────────────────────────────────────────────

@Composable
private fun SmallDashboardCard(
    modifier: Modifier = Modifier,
    title: String,
    text: String,
    footer: String,
    borderColor: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.height(135.dp).clickable { onClick() },
        shape    = RoundedCornerShape(20.dp),
        colors   = CardDefaults.cardColors(containerColor = Color.White),
        border   = androidx.compose.foundation.BorderStroke(0.5.dp, borderColor)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = title, color = Color.Gray, style = MaterialTheme.typography.bodySmall)
            Column {
                Text(text = text, color = Color(0xFF333333), fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.bodyMedium)
                if (footer.isNotBlank())
                    Text(text = footer, color = Color.Gray, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String, actionText: String, onActionClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = title, fontWeight = FontWeight.Bold, color = Color(0xFF27500A))
        Text(text = actionText, color = Color(0xFF27500A),
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.clickable { onActionClick() })
    }
}

@Composable
private fun EventRow(event: DashboardEvent, borderColor: Color) {
    val formattedDate = remember(event.fechaMillis) {
        SimpleDateFormat("dd MMM - hh:mm a", Locale.getDefault()).format(Date(event.fechaMillis))
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape    = RoundedCornerShape(16.dp),
        colors   = CardDefaults.cardColors(containerColor = Color.White),
        border   = androidx.compose.foundation.BorderStroke(0.5.dp, borderColor)
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("●", color = borderColor, modifier = Modifier.padding(end = 10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(event.titulo, color = Color(0xFF333333), fontWeight = FontWeight.Medium)
                Text(formattedDate, color = Color.Gray, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun ActivityRow(activity: DashboardActivity) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape    = RoundedCornerShape(16.dp),
        colors   = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(getActivityEmoji(activity.tipo), modifier = Modifier.padding(end = 12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(activity.nombre, color = Color(0xFF333333), fontWeight = FontWeight.Medium)
                Text("${activity.horaInicio} ${activity.horaFin}".trim(),
                    color = Color.Gray, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun EmptyCard(text: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape    = RoundedCornerShape(16.dp),
        colors   = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Text(text = text, modifier = Modifier.padding(20.dp), color = Color.Gray)
    }
}

private fun getActivityEmoji(tipo: String): String = when (tipo) {
    "clase"     -> "📖"
    "estudio"   -> "✏️"
    "trabajo"   -> "💼"
    "descanso"  -> "🌿"
    "personal"  -> "🌟"
    "ejercicio" -> "🏃"
    else        -> "📌"
}