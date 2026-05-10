package com.example.carpediem.presentation.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

@Composable
fun MiniCalendarCard(
    eventos: List<DashboardEvent>,
    onCalendarClick: () -> Unit
) {
    val today = Calendar.getInstance()
    val dayNumber = today.get(Calendar.DAY_OF_MONTH)
    val monthShort = SimpleDateFormat("MMM", Locale("es", "GT"))
        .format(today.time)
        .uppercase()
        .replace(".", "")

    val monthFull = SimpleDateFormat("MMMM", Locale("es", "GT"))
        .format(today.time)
        .replaceFirstChar { it.uppercase() }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        onClick = onCalendarClick
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column {
                    Text(
                        text = monthShort,
                        color = Color(0xFF27500A),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = dayNumber.toString(),
                        color = Color(0xFF111111),
                        style = MaterialTheme.typography.displayMedium,
                        fontWeight = FontWeight.Bold
                    )
                }

                Column(
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = monthFull,
                        color = Color(0xFF27500A),
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium
                    )

                    Text(
                        text = "Ver calendario",
                        color = Color.Gray,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            WeekRow()

            if (eventos.isEmpty()) {
                Text(
                    text = "Sin eventos próximos ✨",
                    color = Color.Gray,
                    style = MaterialTheme.typography.bodySmall
                )
            } else {
                eventos.take(2).forEach { evento ->
                    MiniEventRow(evento)
                }
            }
        }
    }
}

@Composable
private fun WeekRow() {
    val today = Calendar.getInstance()
    val currentDay = today.get(Calendar.DAY_OF_MONTH)

    val startOfWeek = Calendar.getInstance().apply {
        firstDayOfWeek = Calendar.MONDAY
        set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
    }

    val days = List(7) { index ->
        (startOfWeek.clone() as Calendar).apply {
            add(Calendar.DAY_OF_MONTH, index)
        }
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        days.forEach { day ->
            val isToday =
                day.get(Calendar.DAY_OF_MONTH) == currentDay &&
                        day.get(Calendar.MONTH) == today.get(Calendar.MONTH) &&
                        day.get(Calendar.YEAR) == today.get(Calendar.YEAR)

            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = SimpleDateFormat("E", Locale("es", "GT"))
                        .format(day.time)
                        .take(2)
                        .replaceFirstChar { it.uppercase() },
                    color = Color.Gray,
                    style = MaterialTheme.typography.labelSmall
                )

                Spacer(modifier = Modifier.height(6.dp))

                Surface(
                    shape = CircleShape,
                    color = if (isToday) Color(0xFFB2D8B2) else Color.Transparent,
                    modifier = Modifier.size(34.dp)
                ) {
                    Box(
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = day.get(Calendar.DAY_OF_MONTH).toString(),
                            color = if (isToday) Color(0xFF27500A) else Color(0xFF333333),
                            fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MiniEventRow(
    event: DashboardEvent
) {
    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(Color(0xFFB2D8B2), CircleShape)
        )

        Spacer(modifier = Modifier.width(10.dp))

        Column {
            Text(
                text = event.titulo,
                color = Color(0xFF333333),
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.bodyMedium
            )

            Text(
                text = event.fechaTexto,
                color = Color.Gray,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}