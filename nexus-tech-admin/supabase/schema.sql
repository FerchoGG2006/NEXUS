-- =============================================
-- NEXUS TECH-ADMIN - Database Schema
-- Sistema de Gestión y Ventas de Accesorios Tecnológicos
-- =============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: productos
-- Catálogo de productos con control de precios y stock
-- =============================================
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    stock INT DEFAULT 0 CHECK (stock >= 0),
    stock_minimo INT DEFAULT 5,
    costo_compra DECIMAL(10,2) NOT NULL CHECK (costo_compra >= 0),
    precio_retail DECIMAL(10,2) NOT NULL CHECK (precio_retail >= 0),
    precio_b2b DECIMAL(10,2) NOT NULL CHECK (precio_b2b >= 0),
    categoria TEXT NOT NULL,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: afiliados
-- Red de afiliados con sistema de comisiones
-- =============================================
CREATE TABLE afiliados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    codigo_referido TEXT UNIQUE NOT NULL,
    comision_porcentaje DECIMAL(5,2) DEFAULT 10.00 CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 50),
    balance_acumulado DECIMAL(10,2) DEFAULT 0,
    balance_pagado DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    nivel TEXT DEFAULT 'Bronce' CHECK (nivel IN ('Bronce', 'Plata', 'Oro', 'Platino')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: clientes_b2b
-- Clientes mayoristas y empresariales
-- =============================================
CREATE TABLE clientes_b2b (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razon_social TEXT NOT NULL,
    ruc TEXT UNIQUE,
    contacto_nombre TEXT,
    contacto_email TEXT,
    contacto_telefono TEXT,
    direccion TEXT,
    linea_credito DECIMAL(10,2) DEFAULT 0,
    saldo_pendiente DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: ventas
-- Registro de todas las transacciones
-- =============================================
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_venta TEXT UNIQUE NOT NULL,
    producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
    afiliado_id UUID REFERENCES afiliados(id) ON DELETE SET NULL,
    cliente_b2b_id UUID REFERENCES clientes_b2b(id) ON DELETE SET NULL,
    tipo_venta TEXT NOT NULL CHECK (tipo_venta IN ('Retail', 'B2B', 'Afiliado')),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total_venta DECIMAL(10,2) NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    comision_afiliado DECIMAL(10,2) DEFAULT 0,
    gastos_operativos DECIMAL(10,2) DEFAULT 0,
    ganancia_neta DECIMAL(10,2) NOT NULL,
    estado TEXT DEFAULT 'Completada' CHECK (estado IN ('Pendiente', 'Completada', 'Cancelada', 'Reembolsada')),
    notas TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: cotizaciones_b2b
-- Cotizaciones para clientes mayoristas
-- =============================================
CREATE TABLE cotizaciones_b2b (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_cotizacion TEXT UNIQUE NOT NULL,
    cliente_b2b_id UUID REFERENCES clientes_b2b(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada', 'Vencida')),
    valida_hasta DATE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: pagos_afiliados
-- Historial de pagos a afiliados
-- =============================================
CREATE TABLE pagos_afiliados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    afiliado_id UUID REFERENCES afiliados(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    metodo_pago TEXT NOT NULL,
    referencia TEXT,
    estado TEXT DEFAULT 'Completado' CHECK (estado IN ('Pendiente', 'Completado', 'Fallido')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: configuracion
-- Configuración general del sistema
-- =============================================
CREATE TABLE configuracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_stock ON productos(stock);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_tipo ON ventas(tipo_venta);
CREATE INDEX idx_ventas_afiliado ON ventas(afiliado_id);
CREATE INDEX idx_afiliados_codigo ON afiliados(codigo_referido);
CREATE INDEX idx_afiliados_activo ON afiliados(activo);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_afiliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas para ADMIN (acceso total)
CREATE POLICY "Admin acceso total productos" ON productos
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acceso total afiliados" ON afiliados
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acceso total clientes_b2b" ON clientes_b2b
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acceso total ventas" ON ventas
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acceso total cotizaciones" ON cotizaciones_b2b
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acceso total pagos" ON pagos_afiliados
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acceso total config" ON configuracion
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para AFILIADOS (acceso limitado)
CREATE POLICY "Afiliados ven su perfil" ON afiliados
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Afiliados ven productos activos" ON productos
    FOR SELECT USING (activo = true);

CREATE POLICY "Afiliados ven sus ventas" ON ventas
    FOR SELECT USING (afiliado_id IN (
        SELECT id FROM afiliados WHERE user_id = auth.uid()
    ));

CREATE POLICY "Afiliados ven sus pagos" ON pagos_afiliados
    FOR SELECT USING (afiliado_id IN (
        SELECT id FROM afiliados WHERE user_id = auth.uid()
    ));

-- =============================================
-- FUNCIONES
-- =============================================

-- Función para obtener el balance de un afiliado
CREATE OR REPLACE FUNCTION obtener_balance_afiliado(afiliado_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_comisiones DECIMAL;
    total_pagado DECIMAL;
BEGIN
    SELECT COALESCE(SUM(comision_afiliado), 0) INTO total_comisiones
    FROM ventas 
    WHERE afiliado_id = afiliado_uuid 
    AND tipo_venta = 'Afiliado'
    AND estado = 'Completada';
    
    SELECT COALESCE(SUM(monto), 0) INTO total_pagado
    FROM pagos_afiliados
    WHERE afiliado_id = afiliado_uuid
    AND estado = 'Completado';
    
    RETURN total_comisiones - total_pagado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular ganancia neta de una venta
CREATE OR REPLACE FUNCTION calcular_ganancia_neta(
    p_total_venta DECIMAL,
    p_costo_compra DECIMAL,
    p_cantidad INT,
    p_comision_afiliado DECIMAL DEFAULT 0,
    p_gastos_operativos DECIMAL DEFAULT 0
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN p_total_venta - (p_costo_compra * p_cantidad) - p_comision_afiliado - p_gastos_operativos;
END;
$$ LANGUAGE plpgsql;

-- Función para generar número de venta
CREATE OR REPLACE FUNCTION generar_numero_venta()
RETURNS TEXT AS $$
DECLARE
    nuevo_numero TEXT;
    contador INT;
BEGIN
    SELECT COUNT(*) + 1 INTO contador FROM ventas;
    nuevo_numero := 'NTX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 5, '0');
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Función para generar número de cotización
CREATE OR REPLACE FUNCTION generar_numero_cotizacion()
RETURNS TEXT AS $$
DECLARE
    nuevo_numero TEXT;
    contador INT;
BEGIN
    SELECT COUNT(*) + 1 INTO contador FROM cotizaciones_b2b;
    nuevo_numero := 'COT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 4, '0');
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener productos con stock crítico
CREATE OR REPLACE FUNCTION obtener_stock_critico()
RETURNS TABLE (
    id UUID,
    sku TEXT,
    nombre TEXT,
    stock INT,
    stock_minimo INT,
    categoria TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.sku, p.nombre, p.stock, p.stock_minimo, p.categoria
    FROM productos p
    WHERE p.stock <= p.stock_minimo AND p.activo = true
    ORDER BY p.stock ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener métricas del dashboard
CREATE OR REPLACE FUNCTION obtener_metricas_dashboard(fecha_inicio DATE DEFAULT NULL, fecha_fin DATE DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    resultado JSON;
    f_inicio DATE;
    f_fin DATE;
BEGIN
    f_inicio := COALESCE(fecha_inicio, DATE_TRUNC('month', CURRENT_DATE)::DATE);
    f_fin := COALESCE(fecha_fin, CURRENT_DATE);
    
    SELECT json_build_object(
        'ganancia_neta_total', (
            SELECT COALESCE(SUM(ganancia_neta), 0) 
            FROM ventas 
            WHERE fecha::DATE BETWEEN f_inicio AND f_fin 
            AND estado = 'Completada'
        ),
        'total_ventas', (
            SELECT COALESCE(SUM(total_venta), 0) 
            FROM ventas 
            WHERE fecha::DATE BETWEEN f_inicio AND f_fin 
            AND estado = 'Completada'
        ),
        'numero_transacciones', (
            SELECT COUNT(*) 
            FROM ventas 
            WHERE fecha::DATE BETWEEN f_inicio AND f_fin 
            AND estado = 'Completada'
        ),
        'ventas_retail', (
            SELECT COALESCE(SUM(total_venta), 0) 
            FROM ventas 
            WHERE fecha::DATE BETWEEN f_inicio AND f_fin 
            AND tipo_venta = 'Retail' 
            AND estado = 'Completada'
        ),
        'ventas_b2b', (
            SELECT COALESCE(SUM(total_venta), 0) 
            FROM ventas 
            WHERE fecha::DATE BETWEEN f_inicio AND f_fin 
            AND tipo_venta = 'B2B' 
            AND estado = 'Completada'
        ),
        'ventas_afiliados', (
            SELECT COALESCE(SUM(total_venta), 0) 
            FROM ventas 
            WHERE fecha::DATE BETWEEN f_inicio AND f_fin 
            AND tipo_venta = 'Afiliado' 
            AND estado = 'Completada'
        ),
        'comisiones_pagadas', (
            SELECT COALESCE(SUM(comision_afiliado), 0) 
            FROM ventas 
            WHERE fecha::DATE BETWEEN f_inicio AND f_fin 
            AND estado = 'Completada'
        ),
        'productos_stock_critico', (
            SELECT COUNT(*) 
            FROM productos 
            WHERE stock <= stock_minimo AND activo = true
        ),
        'afiliados_activos', (
            SELECT COUNT(*) 
            FROM afiliados 
            WHERE activo = true
        )
    ) INTO resultado;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger para actualizar stock después de una venta
CREATE OR REPLACE FUNCTION actualizar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.estado = 'Completada' THEN
        UPDATE productos 
        SET stock = stock - NEW.cantidad,
            updated_at = NOW()
        WHERE id = NEW.producto_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.estado != 'Completada' AND NEW.estado = 'Completada' THEN
        UPDATE productos 
        SET stock = stock - NEW.cantidad,
            updated_at = NOW()
        WHERE id = NEW.producto_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.estado = 'Completada' AND NEW.estado IN ('Cancelada', 'Reembolsada') THEN
        UPDATE productos 
        SET stock = stock + NEW.cantidad,
            updated_at = NOW()
        WHERE id = NEW.producto_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock
    AFTER INSERT OR UPDATE ON ventas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_venta();

-- Trigger para actualizar balance del afiliado
CREATE OR REPLACE FUNCTION actualizar_balance_afiliado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.afiliado_id IS NOT NULL AND NEW.tipo_venta = 'Afiliado' AND NEW.estado = 'Completada' THEN
        UPDATE afiliados 
        SET balance_acumulado = balance_acumulado + NEW.comision_afiliado,
            updated_at = NOW()
        WHERE id = NEW.afiliado_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_balance
    AFTER INSERT ON ventas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_balance_afiliado();

-- Trigger para timestamps
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_productos_updated
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_afiliados_updated
    BEFORE UPDATE ON afiliados
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_clientes_b2b_updated
    BEFORE UPDATE ON clientes_b2b
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Configuración inicial
INSERT INTO configuracion (clave, valor, descripcion) VALUES
    ('gastos_operativos_porcentaje', '5', 'Porcentaje de gastos operativos por venta'),
    ('iva_porcentaje', '12', 'Porcentaje de IVA aplicable'),
    ('moneda', 'USD', 'Moneda del sistema'),
    ('empresa_nombre', 'NEXUS TECH-ADMIN', 'Nombre de la empresa'),
    ('empresa_direccion', 'Tu dirección aquí', 'Dirección de la empresa'),
    ('empresa_telefono', '+1234567890', 'Teléfono de contacto'),
    ('empresa_email', 'contacto@nexustech.com', 'Email de contacto');

-- Categorías de productos de ejemplo
INSERT INTO productos (sku, nombre, descripcion, stock, stock_minimo, costo_compra, precio_retail, precio_b2b, categoria) VALUES
    ('ACC-001', 'Audífonos Bluetooth Pro', 'Audífonos inalámbricos con cancelación de ruido', 50, 10, 25.00, 59.99, 45.00, 'Audio'),
    ('ACC-002', 'Cargador Inalámbrico 15W', 'Cargador inalámbrico de carga rápida', 100, 15, 8.00, 24.99, 18.00, 'Cargadores'),
    ('ACC-003', 'Funda iPhone 15 Pro', 'Funda protectora con diseño premium', 200, 20, 3.50, 14.99, 10.00, 'Fundas'),
    ('ACC-004', 'Cable USB-C 2m', 'Cable de carga rápida USB-C a USB-C', 150, 25, 2.00, 9.99, 6.50, 'Cables'),
    ('ACC-005', 'Power Bank 10000mAh', 'Batería portátil con carga rápida', 75, 10, 15.00, 39.99, 30.00, 'Baterías');
