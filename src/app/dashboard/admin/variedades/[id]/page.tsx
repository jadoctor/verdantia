import VariedadForm from '@/components/admin/VariedadForm';

export default async function EditVariedadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const isNew = resolvedParams.id === 'nueva';
  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <VariedadForm variedadId={isNew ? null : resolvedParams.id} />
    </div>
  );
}
