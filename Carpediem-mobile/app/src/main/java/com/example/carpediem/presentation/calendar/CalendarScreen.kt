package com.example.carpediem.presentation.calendar

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
import com.example.carpediem.data.remote.firebase.CalendarEventDto
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import android.app.DatePickerDialog
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.ui.platform.LocalContext
import com.example.carpediem.ui.theme.EmotionColorManager
import com.example.carpediem.ui.theme.emotionBackgroundColor
import com.example.carpediem.ui.theme.emotionCardColor
import com.example.carpediem.ui.theme.emotionAccentColor
@Composable
fun CalendarScreen(
    viewModel: CalendarViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current


    val nivel by EmotionColorManager.nivelEmocion.collectAsState()
    val background = emotionBackgroundColor(nivel)
    val cardColor = emotionCardColor(nivel)
    val accentColor = emotionAccentColor(nivel)

    var showAddDialog by remember { mutableStateOf(false) }
    var newTitle by remember { mutableStateOf("") }
    var newDescription by remember { mutableStateOf("") }
    var newType by remember { mutableStateOf("tarea") }
    var newDateMillis by remember { mutableStateOf(System.currentTimeMillis()) }

    val datePicker = DatePickerDialog(
        context,
        { _, year, month, day ->
            val selected = Calendar.getInstance().apply {
                set(Calendar.YEAR, year)
                set(Calendar.MONTH, month)
                set(Calendar.DAY_OF_MONTH, day)
                set(Calendar.HOUR_OF_DAY, 12)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }

            newDateMillis = selected.timeInMillis
        },
        Calendar.getInstance().get(Calendar.YEAR),
        Calendar.getInstance().get(Calendar.MONTH),
        Calendar.getInstance().get(Calendar.DAY_OF_MONTH)
    )

    var currentMonth by remember { mutableStateOf(Calendar.getInstance()) }
    var selectedDay by remember {
        mutableStateOf(Calendar.getInstance().get(Calendar.DAY_OF_MONTH))
    }

    val selectedEvents = state.events.filter { event ->
        val eventCal = Calendar.getInstance().apply {
            timeInMillis = event.fechaMillis
        }

        event.fechaMillis != 0L &&
                eventCal.get(Calendar.YEAR) == currentMonth.get(Calendar.YEAR) &&
                eventCal.get(Calendar.MONTH) == currentMonth.get(Calendar.MONTH) &&
                eventCal.get(Calendar.DAY_OF_MONTH) == selectedDay
    }
    val upcomingEvents = state.events
        .filter { !it.completado }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = background
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "📅 Agenda",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF27500A)
                        )

                        Text(
                            text = "Organiza tus entregas y sesiones de estudio.",
                            color = Color.Gray
                        )
                    }

                    FloatingActionButton(
                        onClick = { showAddDialog = true },
                        containerColor = accentColor,
                        contentColor = Color(0xFF27500A),
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Agregar evento"
                        )
                    }
                }
            }


            item {
                MonthlyCalendarCard(
                    currentMonth = currentMonth,
                    selectedDay = selectedDay,
                    cardColor = cardColor,
                    accentColor = accentColor,
                    events = state.events,
                    onPreviousMonth = {
                        currentMonth = (currentMonth.clone() as Calendar).apply {
                            add(Calendar.MONTH, -1)
                        }
                        selectedDay = 1
                    },
                    onNextMonth = {
                        currentMonth = (currentMonth.clone() as Calendar).apply {
                            add(Calendar.MONTH, 1)
                        }
                        selectedDay = 1
                    },
                    onDaySelected = { day ->
                        selectedDay = day
                    }
                )
            }

            item {
                Text(
                    text = "Eventos del día",
                    color = Color(0xFF27500A),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            if (state.isLoading) {
                item {
                    CircularProgressIndicator()
                }
            } else if (selectedEvents.isEmpty()) {
                item {
                    EmptyDayCard()
                }
            } else {
                items(selectedEvents) { event ->
                    EventCard(
                        event = event,
                        cardColor = cardColor,
                        accentColor = accentColor,
                        onToggleCompleted = {
                            viewModel.deleteEvent(event.id)
                        }
                    )
                }
            }
            item {
                Text(
                    text = "Próximos eventos",
                    color = Color(0xFF27500A),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            if (upcomingEvents.isEmpty()) {
                item {
                    EmptyUpcomingCard()
                }
            } else {
                items(upcomingEvents) { event ->
                    EventCard(
                        event = event,
                        cardColor = cardColor,
                        accentColor = accentColor,
                        onToggleCompleted = {
                            viewModel.deleteEvent(event.id)
                        }
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(70.dp))
            }
        }
        if (showAddDialog) {
            AddEventDialog(
                title = newTitle,
                description = newDescription,
                type = newType,
                dateMillis = newDateMillis,
                onTitleChange = { newTitle = it },
                onDescriptionChange = { newDescription = it },
                onTypeChange = { newType = it },
                onPickDate = { datePicker.show() },
                onDismiss = {
                    showAddDialog = false
                },
                onSave = {
                    viewModel.addEvent(
                        titulo = newTitle,
                        descripcion = newDescription,
                        tipo = newType,
                        fechaMillis = newDateMillis
                    )

                    newTitle = ""
                    newDescription = ""
                    newType = "tarea"
                    newDateMillis = System.currentTimeMillis()
                    showAddDialog = false
                }
            )
        }
    }
}

@Composable
private fun MonthlyCalendarCard(
    currentMonth: Calendar,
    selectedDay: Int,
    events: List<CalendarEventDto>,
    cardColor: Color,
    accentColor: Color,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onDaySelected: (Int) -> Unit
){
    val monthTitle = SimpleDateFormat(
        "MMMM yyyy",
        Locale("es", "GT")
    ).format(currentMonth.time).replaceFirstChar { it.uppercase() }

    val days = generateMonthDays(currentMonth)
    val weekDays = listOf("Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do")

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = cardColor)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onPreviousMonth) {
                    Text("‹", style = MaterialTheme.typography.headlineSmall)
                }

                Text(
                    text = monthTitle,
                    color = Color(0xFF27500A),
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )

                IconButton(onClick = onNextMonth) {
                    Text("›", style = MaterialTheme.typography.headlineSmall)
                }
            }

            Row(modifier = Modifier.fillMaxWidth()) {
                weekDays.forEach { day ->
                    Text(
                        text = day,
                        modifier = Modifier.weight(1f),
                        color = Color.Gray,
                        fontWeight = FontWeight.SemiBold,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            days.chunked(7).forEach { week ->
                Row(modifier = Modifier.fillMaxWidth()) {
                    week.forEach { day ->
                        DayCell(
                            day = day,
                            selectedDay = selectedDay,
                            currentMonth = currentMonth,
                            events = events,
                            accentColor = accentColor,
                            onDaySelected = onDaySelected,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DayCell(
    day: Int?,
    selectedDay: Int,
    currentMonth: Calendar,
    events: List<CalendarEventDto>,
    accentColor: Color,
    onDaySelected: (Int) -> Unit,
    modifier: Modifier = Modifier
){
    if (day == null) {
        Box(
            modifier = modifier
                .height(44.dp)
        )
        return
    }

    val hasEvent = events.any { event ->
        val cal = Calendar.getInstance().apply {
            timeInMillis = event.fechaMillis
        }

        event.fechaMillis != 0L &&
                cal.get(Calendar.YEAR) == currentMonth.get(Calendar.YEAR) &&
                cal.get(Calendar.MONTH) == currentMonth.get(Calendar.MONTH) &&
                cal.get(Calendar.DAY_OF_MONTH) == day
    }

    val isSelected = day == selectedDay

    Column(
        modifier = modifier
            .height(46.dp)
            .clickable { onDaySelected(day) },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Surface(
            shape = CircleShape,
            color = if (isSelected) accentColor else Color.Transparent,
            modifier = Modifier.size(34.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = day.toString(),
                    color = if (isSelected) accentColor else Color(0xFF333333),
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                )
            }
        }

        if (hasEvent) {
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .background(Color(0xFF27500A), CircleShape)
            )
        } else {
            Spacer(modifier = Modifier.height(5.dp))
        }
    }
}

@Composable
private fun EventCard(
    event: CalendarEventDto,
    cardColor: Color,
    accentColor: Color,
    onToggleCompleted: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = cardColor)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = event.completado,
                onCheckedChange = { onToggleCompleted() }
            )

            Spacer(modifier = Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = event.titulo,
                    fontWeight = FontWeight.Bold,
                    color = accentColor
                )

                if (event.descripcion.isNotBlank()) {
                    Text(
                        text = event.descripcion,
                        color = Color.Gray,
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                Text(
                    text = formatDate(event.fechaMillis),
                    color = Color.Gray,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun EmptyDayCard() {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Text(
            text = "No hay eventos para este día ✨",
            modifier = Modifier.padding(20.dp),
            color = Color.Gray
        )
    }
}

private fun generateMonthDays(calendar: Calendar): List<Int?> {
    val temp = calendar.clone() as Calendar
    temp.set(Calendar.DAY_OF_MONTH, 1)

    val firstDayOfWeek = temp.get(Calendar.DAY_OF_WEEK)
    val mondayBasedOffset = when (firstDayOfWeek) {
        Calendar.MONDAY -> 0
        Calendar.TUESDAY -> 1
        Calendar.WEDNESDAY -> 2
        Calendar.THURSDAY -> 3
        Calendar.FRIDAY -> 4
        Calendar.SATURDAY -> 5
        Calendar.SUNDAY -> 6
        else -> 0
    }

    val maxDay = temp.getActualMaximum(Calendar.DAY_OF_MONTH)

    val days = mutableListOf<Int?>()

    repeat(mondayBasedOffset) {
        days.add(null)
    }

    for (day in 1..maxDay) {
        days.add(day)
    }

    while (days.size % 7 != 0) {
        days.add(null)
    }

    return days
}

private fun formatDate(fechaMillis: Long): String {
    if (fechaMillis == 0L) return "Sin fecha"

    return SimpleDateFormat(
        "dd MMM yyyy",
        Locale("es", "GT")
    ).format(fechaMillis)
}
@Composable
private fun EmptyUpcomingCard() {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Text(
            text = "No tienes eventos próximos.",
            modifier = Modifier.padding(20.dp),
            color = Color.Gray
        )
    }
}
@Composable
private fun AddEventDialog(
    title: String,
    description: String,
    type: String,
    dateMillis: Long,
    onTitleChange: (String) -> Unit,
    onDescriptionChange: (String) -> Unit,
    onTypeChange: (String) -> Unit,
    onPickDate: () -> Unit,
    onDismiss: () -> Unit,
    onSave: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Agregar evento",
                color = Color(0xFF27500A),
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = onTitleChange,
                    label = { Text("Título") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = onDescriptionChange,
                    label = { Text("Descripción") },
                    modifier = Modifier.fillMaxWidth()
                )

                Text(
                    text = "Tipo",
                    color = Color(0xFF27500A),
                    fontWeight = FontWeight.SemiBold
                )

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("tarea", "examen", "proyecto").forEach { option ->
                        FilterChip(
                            selected = type == option,
                            onClick = { onTypeChange(option) },
                            label = {
                                Text(option.replaceFirstChar { it.uppercase() })
                            }
                        )
                    }
                }

                Button(
                    onClick = onPickDate,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFE1F5EE),
                        contentColor = Color(0xFF27500A)
                    )
                ) {
                    Text("Fecha: ${formatDate(dateMillis)}")
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onSave,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFB2D8B2),
                    contentColor = Color(0xFF27500A)
                )
            ) {
                Text("Guardar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}