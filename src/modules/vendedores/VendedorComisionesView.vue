<template>
  <div class="comisiones p-4">
    <h2 class="text-2xl font-bold mb-1">Mis comisiones</h2>
    <p class="text-sm text-gray-500 mb-5">
      Complex que trajiste a QPS y lo que se te paga por ellos esta semana.
    </p>

    <!-- Rango -->
    <div class="flex flex-wrap items-end gap-3 mb-6">
      <div class="flex flex-col">
        <label class="font-semibold text-sm mb-1">Desde</label>
        <Calendar v-model="desde" dateFormat="mm-dd-yy" class="w-44" />
      </div>
      <div class="flex flex-col">
        <label class="font-semibold text-sm mb-1">Hasta</label>
        <Calendar v-model="hasta" dateFormat="mm-dd-yy" class="w-44" />
      </div>
      <Button class="boton-filtro" label="Ver" icon="pi pi-search" :loading="cargando" @click="cargar" />
      <Button
        class="boton-filtro"
        label="Semana pasada"
        severity="secondary"
        outlined
        @click="usarSemanaPasada"
      />
    </div>

    <!-- Resumen -->
    <div v-if="reporte" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="tarjeta tarjeta--principal">
        <span class="tarjeta__titulo">A cobrar en el periodo</span>
        <span class="tarjeta__valor">{{ moneda(reporte.periodo.comision) }}</span>
        <span class="tarjeta__pie">sobre {{ moneda(reporte.periodo.base) }} de base</span>
      </div>

      <div class="tarjeta">
        <span class="tarjeta__titulo">Contra el periodo anterior</span>
        <span class="tarjeta__valor" :class="claseVariacion">
          {{ textoVariacion }}
        </span>
        <span class="tarjeta__pie">
          antes: {{ moneda(reporte.comparativo.periodoAnterior.comision) }}
        </span>
      </div>

      <div class="tarjeta">
        <span class="tarjeta__titulo">Acumulado del mes</span>
        <span class="tarjeta__valor">{{ moneda(reporte.acumuladoMes.comision) }}</span>
        <span class="tarjeta__pie">sobre {{ moneda(reporte.acumuladoMes.base) }} de base</span>
      </div>
    </div>

    <!-- Detalle por complex -->
    <div v-if="reporte && reporte.periodo.complexes.length" class="tabla">
      <DataTable :value="reporte.periodo.complexes" stripedRows scrollable>
        <Column field="communityName" header="Complex" />
        <Column header="Base del complex">
          <template #body="{ data }">{{ moneda(data.base) }}</template>
        </Column>
        <Column header="%">
          <template #body="{ data }">{{ (data.tasa * 100).toFixed(0) }}%</template>
        </Column>
        <Column header="Tu comisión">
          <template #body="{ data }">
            <strong>{{ moneda(data.comision) }}</strong>
          </template>
        </Column>
      </DataTable>
      <p class="nota">
        La base es lo que deja el complex después de pagarle a las cleaners y
        antes de los gastos generales de la empresa.
      </p>
    </div>

    <div v-else-if="reporte" class="vacio">
      No hubo servicios facturados en tus complex en este periodo.
    </div>

    <div v-else-if="!cargando" class="vacio">
      Elige un rango de fechas y toca «Ver».
    </div>

    <Toast position="bottom-right" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Button, Calendar, Column, DataTable, Toast, useToast } from 'primevue';
import moment from 'moment-timezone';

import { VendedoresServices, type ReporteVendedor } from './vendedores.services';
import { showToast } from '../../utils/show-toast';

const toast = useToast();
const cargando = ref(false);
const reporte = ref<ReporteVendedor | null>(null);

// Por defecto la semana en curso, que es como se liquida.
const desde = ref<Date>(moment().startOf('isoWeek').toDate());
const hasta = ref<Date>(moment().endOf('isoWeek').toDate());

const moneda = (valor: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valor ?? 0);

const textoVariacion = computed(() => {
  const v = reporte.value?.comparativo.variacion;
  if (v === null || v === undefined) return 'Sin comparación';
  return `${v > 0 ? '+' : ''}${v}%`;
});

const claseVariacion = computed(() => {
  const v = reporte.value?.comparativo.variacion;
  if (v === null || v === undefined) return 'text-gray-400';
  return v >= 0 ? 'text-green-600' : 'text-red-600';
});

async function cargar() {
  cargando.value = true;
  try {
    const resultado = await VendedoresServices.getMisComisiones(
      moment(desde.value).format('YYYY-MM-DD'),
      moment(hasta.value).format('YYYY-MM-DD'),
    );
    if (!resultado) {
      showToast(toast, { severity: 'error', summary: 'No se pudieron cargar tus comisiones' });
      return;
    }
    reporte.value = resultado;
  } finally {
    cargando.value = false;
  }
}

function usarSemanaPasada() {
  desde.value = moment().subtract(1, 'week').startOf('isoWeek').toDate();
  hasta.value = moment().subtract(1, 'week').endOf('isoWeek').toDate();
  cargar();
}

onMounted(cargar);
</script>

<style scoped>
.tarjeta {
  background: #fff;
  border: 1px solid var(--border-soft, #e2e8f0);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tarjeta--principal {
  background: #f0fdf4;
  border-color: #86efac;
}

.tarjeta__titulo {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.tarjeta__valor {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
}

.tarjeta--principal .tarjeta__valor {
  color: #166534;
}

.tarjeta__pie {
  font-size: 0.75rem;
  color: #64748b;
}

.tabla {
  background: #fff;
  border: 1px solid var(--border-soft, #e2e8f0);
  border-radius: 12px;
  padding: 8px;
  /* En celular la tabla no cabe: que se pueda desplazar en vez de cortarse. */
  overflow-x: auto;
}

/* Los campos de fecha llevan etiqueta encima; sin esto los botones quedan
   pegados arriba y se ven desalineados. */
.boton-filtro {
  align-self: flex-end;
}

.nota {
  font-size: 0.75rem;
  color: #64748b;
  padding: 10px 8px 4px;
}

.vacio {
  text-align: center;
  color: #94a3b8;
  padding: 3rem 0;
}
</style>
