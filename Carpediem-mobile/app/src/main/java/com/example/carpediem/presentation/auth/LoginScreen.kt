package com.example.carpediem.presentation.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.app.Activity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.platform.LocalContext
import com.example.carpediem.R
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions

// ─── Paleta de colores fiel al diseño web ───────────────────────────────────
private val BgBeige        = Color(0xFFF5F5DC)
private val CardWhite      = Color(0xFFFFFFFF)
private val AccentGreen    = Color(0xFFE1F5EE)
private val ButtonGreen    = Color(0xFFB2D8B2)
private val ButtonText     = Color(0xFF27500A)
private val PrimaryText    = Color(0xFF085041)
private val SubtleText     = Color(0xFF888888)
private val ErrorColor     = Color(0xFFE87A6A)
private val BorderColor    = Color(0xFFDDDDDD)
private val ActiveTabColor = Color(0xFFE1F5EE)

@Composable
fun LoginScreen(
    onLoginClick: (String, String) -> Unit,
    onRegisterClick: (String, String) -> Unit,
    onGoogleLoginClick: (String) -> Unit,
    errorMessage: String? = null
){
    var email       by remember { mutableStateOf("") }
    var password    by remember { mutableStateOf("") }
    var isRegister  by remember { mutableStateOf(false) }
    var localError  by remember { mutableStateOf<String?>(null) }

    // Prioridad: error del ViewModel > error local de validación
    val displayError = errorMessage ?: localError

    val context = LocalContext.current

    val googleSignInClient = remember {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(context.getString(R.string.default_web_client_id))
            .requestEmail()
            .build()

        GoogleSignIn.getClient(context, gso)
    }

    val googleLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.result
                val idToken = account.idToken

                if (idToken != null) {
                    onGoogleLoginClick(idToken)
                } else {
                    localError = "No se recibió token de Google."
                }

            } catch (e: Exception) {
                localError = "No se pudo iniciar sesión con Google."
            }
        }
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
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {

                // ── Logo + título ──────────────────────────────────────────
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(AccentGreen),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "🌿", fontSize = 24.sp)
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Carpe Diem",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF1A1A1A)
                )
                Text(
                    text = "Tu compañero de estudio adaptativo",
                    fontSize = 13.sp,
                    color = SubtleText,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(24.dp))

                // ── Selector Iniciar sesión / Registrarse ──────────────────
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .border(0.5.dp, BorderColor, RoundedCornerShape(8.dp))
                ) {
                    TabButton(
                        text = "Iniciar sesión",
                        selected = !isRegister,
                        modifier = Modifier.weight(1f)
                    ) {
                        isRegister = false
                        localError = null
                    }
                    TabButton(
                        text = "Registrarse",
                        selected = isRegister,
                        modifier = Modifier.weight(1f)
                    ) {
                        isRegister = true
                        localError = null
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // ── Campo email ────────────────────────────────────────────
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; localError = null },
                    label = { Text("Correo electrónico", fontSize = 14.sp) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                    colors = carpediemTextFieldColors()
                )

                Spacer(modifier = Modifier.height(12.dp))

                // ── Campo contraseña ───────────────────────────────────────
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; localError = null },
                    label = {
                        Text(
                            if (isRegister) "Contraseña (mín. 6 caracteres)" else "Contraseña",
                            fontSize = 14.sp
                        )
                    },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                    colors = carpediemTextFieldColors()
                )

                // ── Mensaje de error ───────────────────────────────────────
                AnimatedVisibility(
                    visible = displayError != null,
                    enter = fadeIn(),
                    exit = fadeOut()
                ) {
                    Text(
                        text = displayError ?: "",
                        fontSize = 12.sp,
                        color = ErrorColor,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ── Botón principal ────────────────────────────────────────
                Button(
                    onClick = {
                        if (email.isBlank() || password.isBlank()) {
                            localError = "Escribe correo y contraseña"
                            return@Button
                        }
                        if (isRegister) {
                            onRegisterClick(email.trim(), password)
                        } else {
                            onLoginClick(email.trim(), password)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ButtonGreen,
                        contentColor   = ButtonText
                    )
                ) {
                    Text(
                        text = if (isRegister) "Crear cuenta" else "Iniciar sesión",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                // ── Separador ─────────────────────────────────────────────
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    HorizontalDivider(modifier = Modifier.weight(1f), color = BorderColor)
                    Text(
                        text = "  o  ",
                        fontSize = 12.sp,
                        color = Color(0xFFAAAAAA)
                    )
                    HorizontalDivider(modifier = Modifier.weight(1f), color = BorderColor)
                }

                // ── Botón Google (sin SDK, solo UI por ahora) ─────────────
                OutlinedButton(
                    onClick = {
                        googleSignInClient.signOut().addOnCompleteListener {
                            googleLauncher.launch(googleSignInClient.signInIntent)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = CardWhite,
                        contentColor = Color(0xFF1A1A1A)
                    ),
                    border = androidx.compose.foundation.BorderStroke(0.5.dp, BorderColor)
                ) {
                    Text(
                        text = "Continuar con Google",
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}

// ── Componente de tab reutilizable ────────────────────────────────────────────
@Composable
private fun TabButton(
    text: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .background(if (selected) ActiveTabColor else CardWhite)
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            fontSize = 13.sp,
            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
            color = if (selected) PrimaryText else SubtleText
        )
    }
}

// ── Colores personalizados para TextField ─────────────────────────────────────
@Composable
private fun carpediemTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor   = PrimaryText,
    unfocusedBorderColor = BorderColor,
    focusedLabelColor    = PrimaryText,
    cursorColor          = PrimaryText
)