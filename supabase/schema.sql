-- Ejecutar en Supabase (SQL Editor).

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  phone_number_id text not null unique,   -- ID del número en WhatsApp Cloud API
  token_cifrado text not null,            -- token de acceso, cifrado con scripts/encrypt.js
  prompt text not null,                   -- rol e instrucciones del bot de este cliente
  modelo text not null default 'gemini-2.5-flash',  -- verifica el modelo vigente en la documentación de Gemini
  limite_mensual int not null default 1000,         -- respuestas del bot por mes
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists mensajes (
  id bigserial primary key,
  cliente_id uuid not null references clientes(id) on delete cascade,
  wa_id text not null,                    -- número del usuario final
  wa_message_id text,                     -- ID del mensaje de Meta (evita duplicados por reintentos)
  rol text not null check (rol in ('user', 'model')),
  contenido text not null,
  created_at timestamptz not null default now(),
  unique (cliente_id, wa_message_id)
);

create index if not exists mensajes_conversacion_idx
  on mensajes (cliente_id, wa_id, created_at desc);

-- Solo el backend (service role) accede a las tablas.
alter table clientes enable row level security;
alter table mensajes enable row level security;
