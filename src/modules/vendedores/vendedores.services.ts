import { apiServicesQps } from '../../api/api';
import { useGlobalStateStore } from '../../store/auth.store';

export interface ComisionPorComplex {
    communityId: string;
    communityName: string;
    base: number;
    tasa: number;
    comision: number;
}

export interface ReporteVendedor {
    vendedor: { id: string; nombre: string };
    periodo: {
        desde: string;
        hasta: string;
        base: number;
        comision: number;
        complexes: ComisionPorComplex[];
    };
    comparativo: {
        periodoAnterior: { comision: number; base: number };
        /** Porcentaje de variación contra el periodo anterior. null si el
         *  anterior fue cero (no se puede calcular una variación). */
        variacion: number | null;
    };
    acumuladoMes: { comision: number; base: number };
}

export class VendedoresServices {
    static store = useGlobalStateStore();

    /** El API toma el vendedor del token, no de un parámetro: nadie puede
     *  consultar las comisiones de otro cambiando la URL. */
    static async getMisComisiones(desde: string, hasta: string): Promise<ReporteVendedor | null> {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get<ReporteVendedor>(
                `/reports/mis-comisiones?startDate=${desde}&endDate=${hasta}`,
            );
            return data;
        } catch {
            return null;
        } finally {
            this.store.setIsLoading(false);
        }
    }
}
