package com.example.carpediem.presentation.onboarding

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.lifecycle.viewmodel.compose.viewModel

// ── Paleta ────────────────────────────────────────────────────────────────────
private val BgBeige     = Color(0xFFF5F5DC)
private val CardWhite   = Color(0xFFFFFFFF)
private val AccentGreen = Color(0xFFE1F5EE)
private val ButtonGreen = Color(0xFFB2D8B2)
private val ButtonText  = Color(0xFF27500A)
private val PrimaryText = Color(0xFF085041)
private val SubtleText  = Color(0xFF888888)
private val BorderColor = Color(0xFFDDDDDD)
private val ActiveBorder= Color(0xFF1D9E75)
private val DotActive   = Color(0xFFB2D8B2)
private val DotInactive = Color(0xFFE0E0E0)
private val ErrorColor  = Color(0xFFE87A6A)

// ── Datos de pasos ────────────────────────────────────────────────────────────
private data class Paso(val titulo: String, val descripcion: String, val icono: String)

private val pasos = listOf(
    Paso("Tus apuntes, ordenados",   "Sube PDFs, fotos de notas o conecta tus apps. La IA los organiza por ti.", "📚"),
    Paso("Tu tiempo, bajo control",  "El calendario detecta exámenes y tareas cercanas. Sin sorpresas de último minuto.", "📅"),
    Paso("A tu ritmo, a tu manera",  "La app aprende cómo estudias mejor y se adapta a ti cada día.", "🌿"),
)

private val opcionesPerfil = listOf(
    "Neurodivergente (TDAH / TEA)",
    "Neurotípico",
    "No estoy seguro/a"
)

private val opcionesMetodo = listOf("Pomodoro", "Feynman", "Active Recall", "No sé aún")

// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun OnboardingScreen(
    onFinishClick: () -> Unit,
    viewModel: OnboardingViewModel = viewModel()
) {
    var pasoActual  by remember { mutableIntStateOf(0) }
    var enPerfil    by remember { mutableStateOf(false) }
    var perfil      by remember { mutableStateOf("") }
    var metodo      by remember { mutableStateOf("") }

    val isLoading   by viewModel.isLoading.collectAsState()
    val finished    by viewModel.finished.collectAsState()
    val errorMsg    by viewModel.errorMessage.collectAsState()

    // Navegar cuando Firestore confirme que se guardó
    LaunchedEffect(finished) {
        if (finished) onFinishClick()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgBeige),
        contentAlignment = Alignment.Center
    ) {
        if (!enPerfil) {
            // ── PANTALLA DE PASOS ─────────────────────────────────────────────
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
                    // Botón "Saltar"
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Text(
                            text = "Saltar",
                            fontSize = 12.sp,
                            color = Color(0xFFAAAAAA),
                            modifier = Modifier.clickable { onFinishClick() }
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Icono del paso
                    Text(text = pasos[pasoActual].icono, fontSize = 48.sp)

                    Spacer(modifier = Modifier.height(16.dp))

                    // Indicadores de puntos
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        pasos.forEachIndexed { i, _ ->
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(if (i == pasoActual) DotActive else DotInactive)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = pasos[pasoActual].titulo,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = pasos[pasoActual].descripcion,
                        fontSize = 13.sp,
                        color = SubtleText,
                        textAlign = TextAlign.Center,
                        lineHeight = 20.sp
                    )

                    Spacer(modifier = Modifier.height(28.dp))

                    Button(
                        onClick = {
                            if (pasoActual < pasos.size - 1) pasoActual++
                            else enPerfil = true
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ButtonGreen,
                            contentColor   = ButtonText
                        )
                    ) {
                        Text(
                            text = if (pasoActual < pasos.size - 1) "Siguiente" else "Continuar",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

        } else {
            // ── PANTALLA DE PERFIL ────────────────────────────────────────────
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .verticalScroll(rememberScrollState()),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardWhite),
                elevation = CardDefaults.cardElevation(1.dp)
            ) {
                Column(modifier = Modifier.padding(32.dp)) {

                    Text(
                        text = "Cuéntanos sobre ti",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "Solo tarda 1 minuto",
                        fontSize = 13.sp,
                        color = SubtleText,
                        modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                    )

                    // ── ¿Cómo te describes? ───────────────────────────────────
                    Text(
                        text = "¿Cómo te describes?",
                        fontSize = 13.sp,
                        color = Color(0xFF555555),
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    opcionesPerfil.forEach { op ->
                        val selected = perfil == op
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 8.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .border(
                                    width = if (selected) 1.5.dp else 0.5.dp,
                                    color = if (selected) ActiveBorder else BorderColor,
                                    shape = RoundedCornerShape(8.dp)
                                )
                                .background(if (selected) AccentGreen else CardWhite)
                                .clickable { perfil = op }
                                .padding(horizontal = 14.dp, vertical = 10.dp)
                        ) {
                            Text(
                                text = op,
                                fontSize = 13.sp,
                                color = if (selected) PrimaryText else Color(0xFF555555)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // ── Método de estudio ─────────────────────────────────────
                    Text(
                        text = "Método de estudio preferido",
                        fontSize = 13.sp,
                        color = Color(0xFF555555),
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(bottom = 24.dp)
                    ) {
                        opcionesMetodo.forEach { op ->
                            val selected = metodo == op
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .border(
                                        width = if (selected) 1.5.dp else 0.5.dp,
                                        color = if (selected) ActiveBorder else BorderColor,
                                        shape = RoundedCornerShape(20.dp)
                                    )
                                    .background(if (selected) AccentGreen else CardWhite)
                                    .clickable { metodo = op }
                                    .padding(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = op,
                                    fontSize = 12.sp,
                                    color = if (selected) PrimaryText else Color(0xFF555555)
                                )
                            }
                        }
                    }

                    // ── Error ─────────────────────────────────────────────────
                    AnimatedVisibility(visible = errorMsg != null, enter = fadeIn(), exit = fadeOut()) {
                        Text(
                            text = errorMsg ?: "",
                            fontSize = 12.sp,
                            color = ErrorColor,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                    }

                    // ── Botón Empezar ─────────────────────────────────────────
                    val habilitado = perfil.isNotBlank() && metodo.isNotBlank() && !isLoading
                    Button(
                        onClick = { viewModel.guardarPerfil(perfil, metodo) },
                        enabled = habilitado,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (habilitado) ButtonGreen else Color(0xFFE0E0E0),
                            contentColor   = if (habilitado) ButtonText  else Color(0xFF999999),
                            disabledContainerColor = Color(0xFFE0E0E0),
                            disabledContentColor   = Color(0xFF999999)
                        )
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = ButtonText,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("Empezar", fontSize = 14.sp, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }
    }
}