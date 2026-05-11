package com.example.carpediem.presentation.checkin

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.*

// ── Paleta ────────────────────────────────────────────────────────────────────
private val BgBeige     = Color(0xFFF5F5DC)
private val CardWhite   = Color(0xFFFFFFFF)
private val ButtonGreen = Color(0xFFB2D8B2)
private val ButtonText  = Color(0xFF27500A)
private val SubtleText  = Color(0xFF888888)
private val BorderColor = Color(0xFFDDDDDD)


// ── Pantalla ──────────────────────────────────────────────────────────────────
@Composable
fun CheckInScreen(
    onFinishClick: () -> Unit,
    viewModel: CheckInViewModel = viewModel()
) {
    var seleccionado by remember { mutableStateOf<Int?>(null) }
    val isLoading   by viewModel.isLoading.collectAsState()
    val finished    by viewModel.finished.collectAsState()
    val errorMsg    by viewModel.errorMessage.collectAsState()

    LaunchedEffect(finished) {
        if (finished) onFinishClick()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgBeige),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = CardWhite),
            elevation = CardDefaults.cardElevation(1.dp)
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(text = "Buenos días", fontSize = 13.sp, color = Color(0xFFAAAAAA))
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "¿Cómo llegaste hoy?",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Tu respuesta ajusta tu sesión de estudio",
                    fontSize = 13.sp,
                    color = SubtleText,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(24.dp))

                // Lista de emociones
                emociones.forEachIndexed { i, e ->
                    val selected = seleccionado == i
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 10.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .border(
                                width = if (selected) 1.5.dp else 0.5.dp,
                                color = if (selected) e.color else BorderColor,
                                shape = RoundedCornerShape(10.dp)
                            )
                            .background(if (selected) e.fondo else CardWhite)
                            .clickable { seleccionado = i }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = e.emoji, fontSize = 24.sp)
                        Spacer(modifier = Modifier.width(14.dp))
                        Text(
                            text = e.label,
                            fontSize = 14.sp,
                            color = Color(0xFF444444),
                            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal
                        )
                    }
                }

                AnimatedVisibility(visible = errorMsg != null, enter = fadeIn(), exit = fadeOut()) {
                    Text(
                        text = errorMsg ?: "",
                        fontSize = 12.sp,
                        color = Color(0xFFE87A6A),
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                val habilitado = seleccionado != null && !isLoading
                Button(
                    onClick = { seleccionado?.let { viewModel.guardar(emociones[it]) } },
                    enabled = habilitado,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (habilitado) ButtonGreen else Color(0xFFE0E0E0),
                        contentColor   = if (habilitado) ButtonText  else Color(0xFF999999),
                        disabledContainerColor = Color(0xFFE0E0E0),
                        disabledContentColor   = Color(0xFF999999)
                    )
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = ButtonText, strokeWidth = 2.dp)
                    } else {
                        Text("Ver mi plan de hoy", fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }
        }
    }
}