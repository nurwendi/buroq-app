package com.buroq.billing.data.api

import kotlinx.serialization.Serializable

@Serializable
data class DashboardStats(
    val pppoeActive: Int = 0,
    val pppoeOffline: Int = 0,
    val cpuLoad: Int = 0,
    val memoryUsed: Long = 0,
    val memoryTotal: Long = 0,
    val serverCpuLoad: Int = 0,
    val serverMemoryUsed: Long = 0,
    val serverMemoryTotal: Long = 0,
    val temperature: Int? = null,
    val totalCustomers: Int = 0,
    val systemUserCount: Int = 0,
    val monthlyRevenue: Double = 0.0 // Added from admin stats if available or custom logic
)
