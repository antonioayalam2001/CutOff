'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Modal } from '@/shared/ui/Modal';
import { useGroups, useCreateGroup, useJoinGroup } from '@/features/groups/hooks/useGroups';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { data: groups, isLoading, isError, error } = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async () => {
    try {
      const { data } = await createGroup.mutateAsync(groupName);
      toast.success('Grupo creado');
      setShowCreate(false);
      setGroupName('');
      router.push(`/groups/${data.id}`);
    } catch {
      toast.error('Error al crear el grupo');
    }
  };

  const handleJoin = async () => {
    try {
      await joinGroup.mutateAsync(inviteCode.toUpperCase());
      toast.success('Solicitud enviada. Espera a que el owner te apruebe.');
      setShowJoin(false);
      setInviteCode('');
    } catch {
      toast.error('Código inválido o ya eres miembro');
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display text-base-100">Mis Grupos</h1>
            <p className="text-sm text-base-500 mt-1">Administra tus grupos de gastos compartidos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowJoin(true)}>
              Unirse con código
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              Crear grupo
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-base-900 rounded-2xl border border-base-800 p-6">
                <div className="h-5 w-3/4 bg-base-800 rounded-md animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%] mb-3" />
                <div className="h-4 w-1/2 bg-base-800 rounded-md animate-shimmer bg-gradient-to-r from-base-800 via-base-700 to-base-800 bg-[length:200%_100%]" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 bg-base-900 rounded-2xl border border-base-800 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-base-400 mb-2">Error al cargar grupos</p>
            <p className="text-sm text-base-500">{error instanceof Error ? error.message : 'Intenta de nuevo más tarde'}</p>
          </div>
        ) : groups?.length === 0 ? (
          <div className="text-center py-16 bg-base-900 rounded-2xl border border-base-800 animate-slide-up">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-base-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-base-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-base-400 mb-6">No tienes grupos aún</p>
            <Button onClick={() => setShowCreate(true)}>Crear mi primer grupo</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups?.map((group, i) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="group block bg-base-900 rounded-2xl border border-base-800 p-6 hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
              >
                <h3 className="font-semibold text-base-100 group-hover:text-primary-400 transition-colors">
                  {group.name}
                </h3>
                <p className="text-sm text-base-500 mt-2">
                  Código: <span className="font-mono text-base-400">{group.inviteCode}</span>
                </p>
              </Link>
            ))}
          </div>
        )}

        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Crear grupo">
          <div className="space-y-4">
            <Input label="Nombre del grupo" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            <Button onClick={handleCreate} isLoading={createGroup.isPending} className="w-full">
              Crear
            </Button>
          </div>
        </Modal>

        <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Unirse a un grupo">
          <div className="space-y-4">
            <Input
              label="Código de invitación"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={8}
              placeholder="Ej: A3X9K2M1"
            />
            <Button onClick={handleJoin} isLoading={joinGroup.isPending} className="w-full">
              Enviar solicitud
            </Button>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
