package com.buroq.billing.data.api

import kotlinx.serialization.Serializable

@Serializable
data class CustomerStats(
    val name: String = "",
    val avatar: String = "",
    val usage: Usage = Usage(),
    val billing: BillingInfo = BillingInfo(),
    val session: SessionStatus = SessionStatus()
)

@Serializable
data class Usage(
    val download: Double = 0.0,
    val upload: Double = 0.0
)

@Serializable
data class BillingInfo(
    val status: String = "paid",
    val amount: Double = 0.0,
    val invoice: String = "-"
)

@Serializable
data class SessionStatus(
    val id: String? = null,
    val uptime: String = "-",
    val active: Boolean = false,
    val ipAddress: String? = null,
    val currentSpeed: Speed? = null
)

@Serializable
data class Speed(
    val tx: String = "0",
    val rx: String = "0"
)
