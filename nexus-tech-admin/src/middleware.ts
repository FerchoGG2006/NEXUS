import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    // En modo demo o sin Firebase configurado, permitir acceso a todas las rutas
    // La autenticación real se maneja en el lado del cliente con Firebase Auth
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
