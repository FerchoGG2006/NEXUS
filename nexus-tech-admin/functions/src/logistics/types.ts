export interface ShipmentResult {
    tracking_number: string;
    courier_name: string;
    cost: number;
    estimated_days: number;
    label_url?: string;
}

export interface LogisticsProvider {
    name: string;

    /**
     * Calcula el costo de envío basado en el destino
     */
    quote(destination: string): Promise<{ cost: number, days: number }>;

    /**
     * Genera una guía de remisión
     */
    createShipment(order: any): Promise<ShipmentResult>;
}
