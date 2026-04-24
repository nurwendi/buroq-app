package com.buroq.billing

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.People
import androidx.compose.ui.graphics.Color
import com.buroq.billing.ui.dashboard.DashboardScreen
import com.buroq.billing.ui.customers.CustomerListScreen
import com.buroq.billing.ui.login.LoginScreen
import com.buroq.billing.ui.theme.BillingAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            BillingAppTheme {
                var currentRole by remember { mutableStateOf<String?>(null) }
                var selectedTab by remember { mutableStateOf(0) }
                
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    if (currentRole == null) {
                        LoginScreen(onLoginSuccess = { role ->
                            currentRole = role
                        })
                    } else {
                        Scaffold(
                            bottomBar = {
                                NavigationBar(
                                    containerColor = Color.White,
                                    tonalElevation = 8.dp
                                ) {
                                    NavigationBarItem(
                                        selected = selectedTab == 0,
                                        onClick = { selectedTab = 0 },
                                        icon = { Icon(Icons.Default.Dashboard, contentDescription = null) },
                                        label = { Text("Dashboard") }
                                    )
                                    NavigationBarItem(
                                        selected = selectedTab == 1,
                                        onClick = { selectedTab = 1 },
                                        icon = { Icon(Icons.Default.People, contentDescription = null) },
                                        label = { Text("Pelanggan") }
                                    )
                                }
                            }
                        ) { padding ->
                            Box(modifier = Modifier.padding(padding)) {
                                if (selectedTab == 0) {
                                    DashboardScreen(role = currentRole!!)
                                } else {
                                    CustomerListScreen()
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DashboardPlaceholder(role: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Logged in as: $role", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text("Dashboard coming soon...", color = Color.Gray)
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    BillingAppTheme {
        Greeting("Android")
    }
}
