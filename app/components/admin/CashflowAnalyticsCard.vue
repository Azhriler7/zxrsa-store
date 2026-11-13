<!-- ==========================================================================
 FILE: app/components/admin/CashflowAnalyticsCard.vue
 DESKRIPSI: Komponen Lego Dashboard Arus Uang (Cashflow) Interaktif:
            - Card Lifetime Revenue, Hari Ini, Bulan Ini, & Filter Rentang Tanggal
            - Grafik Batang Interaktif (Hover Bold + Tooltip Rupiah)
            - Mode Per Hari (Presisi Kalender 28/29/30/31 Hari), Per Minggu,
              Per Bulan, Per Tahun, & Rentang Tanggal Kustom.
=========================================================================== -->
<script setup lang="ts">
export interface DailyCashflowItem {
  date: string
  revenue: number
  txCount: number
}

interface ChartBarPoint {
  key: string
  label: string
  fullLabel: string
  amount: number
  txCount: number
}

const props = defineProps<{
  lifetimeRevenue: number
  lifetimePaidCount: number
  todayRevenue: number
  thisMonthRevenue: number
  dailySeries: DailyCashflowItem[]
}>()

// Waktu default saat ini (WIB)
const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000)
const currentYear = nowWib.getUTCFullYear()
const currentMonth = nowWib.getUTCMonth() + 1 // 1 - 12
const todayYmd = nowWib.toISOString().slice(0, 10)
const firstDayOfMonthYmd = `${todayYmd.slice(0, 7)}-01`

type ChartMode = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom_range'

const activeMode = ref<ChartMode>('daily')
const selectedYear = ref<number>(currentYear)
const selectedMonth = ref<number>(currentMonth)

// State Filter Rentang Tanggal (Dari Tanggal s/d Sampai Tanggal)
const filterStartDate = ref<string>(firstDayOfMonthYmd)
const filterEndDate = ref<string>(todayYmd)

// Index batang yang sedang di-hover
const hoveredBarIndex = ref<number | null>(null)

const monthNames = [
  { value: 1, label: 'Januari', short: 'Jan' },
  { value: 2, label: 'Februari', short: 'Feb' },
  { value: 3, label: 'Maret', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'Mei', short: 'Mei' },
  { value: 6, label: 'Juni', short: 'Jun' },
  { value: 7, label: 'Juli', short: 'Jul' },
  { value: 8, label: 'Agustus', short: 'Agu' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'Oktober', short: 'Okt' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'Desember', short: 'Des' }
]

const availableYears = computed<number[]>(() => {
  const yearsSet = new Set<number>([currentYear - 1, currentYear, currentYear + 1])
  for (const item of props.dailySeries) {
    const y = Number(item.date.slice(0, 4))
    if (!Number.isNaN(y) && y > 2020) {
      yearsSet.add(y)
    }
  }
  return Array.from(yearsSet).sort((a, b) => a - b)
})

// Map cepat YYYY-MM-DD -> { revenue, txCount }
const dailyMap = computed(() => {
  const map = new Map<string, { revenue: number, txCount: number }>()
  for (const item of props.dailySeries) {
    map.set(item.date, {
      revenue: item.revenue,
      txCount: item.txCount
    })
  }
  return map
})

// Hitung jumlah hari presisi dalam bulan & tahun terpilih (Februari = 28 atau 29 jika kabisat)
function getDaysInMonth(year: number, month1To12: number): number {
  return new Date(year, month1To12, 0).getDate()
}

const daysInSelectedMonth = computed(() =>
  getDaysInMonth(selectedYear.value, selectedMonth.value)
)

const selectedMonthName = computed(() =>
  monthNames.find(m => m.value === selectedMonth.value)?.label || ''
)

// ----------------------------------------------------------------------------
// [SECTION: KALKULASI FILTER RENTANG TANGGAL (DARI TGL S/D TGL)]
// ----------------------------------------------------------------------------
const customRangeSummary = computed(() => {
  const start = filterStartDate.value <= filterEndDate.value ? filterStartDate.value : filterEndDate.value
  const end = filterStartDate.value <= filterEndDate.value ? filterEndDate.value : filterStartDate.value

  let totalAmount = 0
  let totalTx = 0

  for (const item of props.dailySeries) {
    if (item.date >= start && item.date <= end) {
      totalAmount += item.revenue
      totalTx += item.txCount
    }
  }

  return {
    start,
    end,
    totalAmount,
    totalTx
  }
})

// ----------------------------------------------------------------------------
// [SECTION: PEMBENTUKAN DATA BATANG GRAFIK SESUAI MODE]
// ----------------------------------------------------------------------------
const chartBars = computed<ChartBarPoint[]>(() => {
  const year = selectedYear.value
  const month = selectedMonth.value
  const monthPadded = String(month).padStart(2, '0')

  // 1. MODE PER HARI (1 s/d 28/29/30/31 sesuai bulan & tahun)
  if (activeMode.value === 'daily') {
    const totalDays = getDaysInMonth(year, month)
    const bars: ChartBarPoint[] = []

    for (let day = 1; day <= totalDays; day++) {
      const dayPadded = String(day).padStart(2, '0')
      const ymd = `${year}-${monthPadded}-${dayPadded}`
      const found = dailyMap.value.get(ymd)

      bars.push({
        key: ymd,
        label: String(day),
        fullLabel: `${day} ${selectedMonthName.value} ${year}`,
        amount: found?.revenue ?? 0,
        txCount: found?.txCount ?? 0
      })
    }
    return bars
  }

  // 2. MODE PER MINGGU (Minggu 1 s/d Minggu 4/5 dalam Bulan Terpilih)
  if (activeMode.value === 'weekly') {
    const totalDays = getDaysInMonth(year, month)
    const weekRanges = [
      { label: 'Minggu 1', start: 1, end: 7 },
      { label: 'Minggu 2', start: 8, end: 14 },
      { label: 'Minggu 3', start: 15, end: 21 },
      { label: 'Minggu 4', start: 22, end: 28 }
    ]
    if (totalDays > 28) {
      weekRanges.push({ label: 'Minggu 5', start: 29, end: totalDays })
    }

    return weekRanges.map((w) => {
      let sumAmount = 0
      let sumTx = 0
      for (let d = w.start; d <= w.end; d++) {
        const ymd = `${year}-${monthPadded}-${String(d).padStart(2, '0')}`
        const found = dailyMap.value.get(ymd)
        if (found) {
          sumAmount += found.revenue
          sumTx += found.txCount
        }
      }
      return {
        key: `${year}-${monthPadded}-${w.label}`,
        label: `${w.label} (${w.start}-${w.end})`,
        fullLabel: `${w.label} • Tgl ${w.start}–${w.end} ${selectedMonthName.value} ${year}`,
        amount: sumAmount,
        txCount: sumTx
      }
    })
  }

  // 3. MODE PER BULAN (Januari s/d Desember dalam Tahun Terpilih)
  if (activeMode.value === 'monthly') {
    return monthNames.map((m) => {
      const ymPrefix = `${year}-${String(m.value).padStart(2, '0')}`
      let sumAmount = 0
      let sumTx = 0

      for (const item of props.dailySeries) {
        if (item.date.startsWith(ymPrefix)) {
          sumAmount += item.revenue
          sumTx += item.txCount
        }
      }

      return {
        key: ymPrefix,
        label: m.short,
        fullLabel: `${m.label} ${year} (${getDaysInMonth(year, m.value)} Hari)`,
        amount: sumAmount,
        txCount: sumTx
      }
    })
  }

  // 4. MODE PER TAHUN (Tahunan)
  if (activeMode.value === 'yearly') {
    return availableYears.value.map((y) => {
      const yPrefix = `${y}-`
      let sumAmount = 0
      let sumTx = 0

      for (const item of props.dailySeries) {
        if (item.date.startsWith(yPrefix)) {
          sumAmount += item.revenue
          sumTx += item.txCount
        }
      }

      return {
        key: String(y),
        label: String(y),
        fullLabel: `Tahun ${y}`,
        amount: sumAmount,
        txCount: sumTx
      }
    })
  }

  // 5. MODE RENTANG TANGGAL KUSTOM (Maksimal 62 hari ditampilkan per batang tanggal)
  const start = customRangeSummary.value.start
  const end = customRangeSummary.value.end
  const bars: ChartBarPoint[] = []

  const startDt = new Date(`${start}T00:00:00Z`)
  const endDt = new Date(`${end}T00:00:00Z`)
  const diffDays = Math.min(62, Math.max(0, Math.round((endDt.getTime() - startDt.getTime()) / 86400000)))

  for (let i = 0; i <= diffDays; i++) {
    const cur = new Date(startDt.getTime() + i * 86400000)
    const ymd = cur.toISOString().slice(0, 10)
    const found = dailyMap.value.get(ymd)

    bars.push({
      key: ymd,
      label: ymd.slice(5),
      fullLabel: `Tanggal ${ymd}`,
      amount: found?.revenue ?? 0,
      txCount: found?.txCount ?? 0
    })
  }

  return bars
})

const maxBarAmount = computed(() => {
  const maxVal = Math.max(...chartBars.value.map(b => b.amount), 0)
  return maxVal > 0 ? maxVal : 1
})

const activeChartTotalRevenue = computed(() =>
  chartBars.value.reduce((acc, b) => acc + b.amount, 0)
)

const activeChartTotalTx = computed(() =>
  chartBars.value.reduce((acc, b) => acc + b.txCount, 0)
)

const hoveredBarData = computed<ChartBarPoint | null>(() => {
  if (hoveredBarIndex.value === null) return null
  return chartBars.value[hoveredBarIndex.value] || null
})

function getBarHeightPercent(amount: number): number {
  if (amount <= 0) return 4
  return Math.max(10, Math.round((amount / maxBarAmount.value) * 100))
}

function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0)
}
</script>

<template>
  <div class="space-y-4">
    <!-- BARIS 1: KARTU SOROTAN ARUS UANG (LIFETIME, BULAN INI, HARI INI, & FILTER TANGGAL) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. TOTAL UANG MASUK LIFETIME (SAMPAI SEKARANG) -->
      <div class="p-4 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-1.5">
        <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-primary">
          <span>Total Uang Masuk Lifetime</span>
          <UIcon
            name="i-lucide-infinity"
            class="w-4 h-4"
          />
        </div>
        <div class="text-2xl font-extrabold font-mono text-highlighted">
          {{ formatRupiah(lifetimeRevenue) }}
        </div>
        <p class="text-xs text-muted">
          Akumulasi seluruh waktu ({{ lifetimePaidCount }} transaksi lunas)
        </p>
      </div>

      <!-- 2. PENDAPATAN HARI INI & BULAN INI -->
      <div class="p-4 rounded-xl border border-default bg-default space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-muted">Hari Ini ({{ todayYmd }}):</span>
          <span class="font-mono text-sm font-extrabold text-success">
            {{ formatRupiah(todayRevenue) }}
          </span>
        </div>
        <div class="border-t border-default pt-2 flex items-center justify-between">
          <span class="text-xs font-semibold text-muted">Bulan Ini:</span>
          <span class="font-mono text-sm font-extrabold text-highlighted">
            {{ formatRupiah(thisMonthRevenue) }}
          </span>
        </div>
      </div>

      <!-- 3. TOTAL UANG MASUK SESUAI FILTER TANGGAL -->
      <div class="p-4 rounded-xl border border-default bg-elevated/50 space-y-1.5">
        <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-warning">
          <span>Total Sesuai Filter Tanggal</span>
          <UIcon
            name="i-lucide-calendar-range"
            class="w-4 h-4"
          />
        </div>
        <div class="text-xl font-extrabold font-mono text-highlighted">
          {{ formatRupiah(customRangeSummary.totalAmount) }}
        </div>
        <p class="text-[11px] text-muted">
          {{ customRangeSummary.start }} s/d {{ customRangeSummary.end }} ({{ customRangeSummary.totalTx }} Lunas)
        </p>
      </div>
    </div>

    <!-- BARIS 2: CARD UTAMA GRAFIK BATANG INTERAKTIF & FILTER KALENDER -->
    <UCard>
      <template #header>
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-bar-chart-3"
                class="w-5 h-5 text-primary"
              />
              <h2 class="text-base font-bold text-highlighted">
                Grafik Batang Arus Uang Masuk (Cashflow)
              </h2>
            </div>
            <p class="text-xs text-muted mt-0.5">
              Arahkan kursor (hover) pada batang grafik untuk melihat rincian nominal uang masuk secara tebal (bold).
            </p>
          </div>

          <!-- TOMBOL PILIH PERIODE: PER HARI, PER MINGGU, PER BULAN, PER TAHUN -->
          <div class="flex flex-wrap items-center gap-1.5">
            <UButton
              size="xs"
              :color="activeMode === 'daily' ? 'primary' : 'neutral'"
              :variant="activeMode === 'daily' ? 'solid' : 'subtle'"
              label="Per Hari"
              @click="activeMode = 'daily'"
            />
            <UButton
              size="xs"
              :color="activeMode === 'weekly' ? 'primary' : 'neutral'"
              :variant="activeMode === 'weekly' ? 'solid' : 'subtle'"
              label="Per Minggu"
              @click="activeMode = 'weekly'"
            />
            <UButton
              size="xs"
              :color="activeMode === 'monthly' ? 'primary' : 'neutral'"
              :variant="activeMode === 'monthly' ? 'solid' : 'subtle'"
              label="Per Bulan"
              @click="activeMode = 'monthly'"
            />
            <UButton
              size="xs"
              :color="activeMode === 'yearly' ? 'primary' : 'neutral'"
              :variant="activeMode === 'yearly' ? 'solid' : 'subtle'"
              label="Per Tahun"
              @click="activeMode = 'yearly'"
            />
            <UButton
              size="xs"
              :color="activeMode === 'custom_range' ? 'warning' : 'neutral'"
              :variant="activeMode === 'custom_range' ? 'solid' : 'subtle'"
              icon="i-lucide-calendar-search"
              label="Rentang Tanggal"
              @click="activeMode = 'custom_range'"
            />
          </div>
        </div>
      </template>

      <div class="space-y-5">
        <!-- BARIS FILTER BULAN/TAHUN & FILTER DARI TANGGAL S/D TANGGAL -->
        <div class="p-3.5 rounded-xl bg-elevated/50 border border-default flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <!-- PEMILIH BULAN & TAHUN KALENDER -->
          <div class="flex flex-wrap items-end gap-3">
            <div
              v-if="activeMode === 'daily' || activeMode === 'weekly'"
              class="space-y-1"
            >
              <label class="text-[11px] font-bold uppercase text-muted block">
                Pilih Bulan ({{ daysInSelectedMonth }} Hari)
              </label>
              <select
                v-model.number="selectedMonth"
                class="rounded-md border border-default bg-default px-3 py-1.5 text-xs font-semibold text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option
                  v-for="m in monthNames"
                  :key="m.value"
                  :value="m.value"
                >
                  {{ m.label }}
                </option>
              </select>
            </div>

            <div
              v-if="activeMode !== 'yearly' && activeMode !== 'custom_range'"
              class="space-y-1"
            >
              <label class="text-[11px] font-bold uppercase text-muted block">
                Pilih Tahun
              </label>
              <select
                v-model.number="selectedYear"
                class="rounded-md border border-default bg-default px-3 py-1.5 text-xs font-semibold text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option
                  v-for="y in availableYears"
                  :key="y"
                  :value="y"
                >
                  {{ y }}
                </option>
              </select>
            </div>

            <div class="px-3 py-1.5 rounded-lg bg-default border border-default text-xs">
              <span class="text-muted">Total di Grafik Ini: </span>
              <strong class="font-mono text-primary">{{ formatRupiah(activeChartTotalRevenue) }}</strong>
              <span class="text-muted"> ({{ activeChartTotalTx }} Trx)</span>
            </div>
          </div>

          <!-- FILTER RENTANG TANGGAL KUSTOM (DARI TGL BERAPA SAMPAI BERAPA) -->
          <div class="flex flex-wrap items-end gap-2">
            <div class="space-y-1">
              <label class="text-[11px] font-bold uppercase text-muted block">
                Dari Tanggal
              </label>
              <input
                v-model="filterStartDate"
                type="date"
                class="rounded-md border border-default bg-default px-2.5 py-1 text-xs font-mono text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
              >
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold uppercase text-muted block">
                Sampai Tanggal
              </label>
              <input
                v-model="filterEndDate"
                type="date"
                class="rounded-md border border-default bg-default px-2.5 py-1 text-xs font-mono text-highlighted focus:outline-none focus:ring-2 focus:ring-primary"
              >
            </div>

            <UButton
              size="xs"
              color="warning"
              variant="subtle"
              icon="i-lucide-filter"
              label="Tampilkan di Grafik"
              @click="activeMode = 'custom_range'"
            />
          </div>
        </div>

        <!-- BANNER INFO HOVER REAL-TIME -->
        <div class="h-9 px-3.5 rounded-lg border border-default bg-default flex items-center justify-between text-xs">
          <template v-if="hoveredBarData">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              <strong class="font-extrabold text-highlighted">{{ hoveredBarData.fullLabel }}</strong>
            </div>
            <div class="font-mono font-extrabold text-sm text-primary">
              {{ formatRupiah(hoveredBarData.amount) }}
              <span class="text-xs font-normal text-muted">({{ hoveredBarData.txCount }} Transaksi)</span>
            </div>
          </template>
          <template v-else>
            <span class="text-muted">
              Sentuh atau arahkan kursor ke batang di bawah untuk melihat detail uang masuk per periode.
            </span>
            <span class="font-mono text-xs text-muted hidden sm:inline">
              Puncak Tertinggi: <strong class="text-highlighted">{{ formatRupiah(maxBarAmount === 1 ? 0 : maxBarAmount) }}</strong>
            </span>
          </template>
        </div>

        <!-- AREA GRAFIK BATANG INTERAKTIF -->
        <div class="overflow-x-auto pb-2">
          <div
            class="h-64 pt-12 pb-2 px-2 flex items-end gap-1.5 sm:gap-2 border-b border-default"
            :class="chartBars.length > 16 ? 'min-w-170' : 'w-full'"
          >
            <div
              v-for="(bar, idx) in chartBars"
              :key="bar.key"
              class="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer select-none"
              @mouseenter="hoveredBarIndex = idx"
              @mouseleave="hoveredBarIndex = null"
            >
              <!-- FLOATING HOVER TOOLTIP (MUNCUL & BOLD SAAT DI-HOVER) -->
              <div
                v-if="hoveredBarIndex === idx"
                class="absolute -top-11 z-20 px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg border border-primary whitespace-nowrap pointer-events-none text-center"
              >
                <div class="text-[11px] font-extrabold font-mono leading-tight">
                  {{ formatRupiah(bar.amount) }}
                </div>
                <div class="text-[9px] font-semibold opacity-80">
                  {{ bar.fullLabel }} ({{ bar.txCount }}x)
                </div>
              </div>

              <!-- BATANG GRAFIK (MENJADI TEBAL/BOLD & BERCAHAYA SAAT HOVER) -->
              <div
                class="w-full rounded-t-md transition-all duration-150"
                :class="[
                  hoveredBarIndex === idx
                    ? 'bg-primary ring-2 ring-primary/60 shadow-md scale-x-110 font-extrabold'
                    : bar.amount > 0
                      ? 'bg-primary/70 hover:bg-primary'
                      : 'bg-elevated border border-default'
                ]"
                :style="{ height: `${getBarHeightPercent(bar.amount)}%` }"
              />

              <!-- LABEL TANGGAL / PERIODE DI BAWAH BATANG (BOLD SAAT HOVER) -->
              <span
                class="mt-2 text-[10px] sm:text-[11px] font-mono transition-all truncate max-w-full"
                :class="
                  hoveredBarIndex === idx
                    ? 'font-extrabold text-primary scale-110'
                    : bar.amount > 0
                      ? 'font-semibold text-highlighted'
                      : 'text-muted'
                "
              >
                {{ bar.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
