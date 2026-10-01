import Badge from '@/components/ui/Badge';

/** Status pill for appointments and inquiries. */
export default function StatusBadge({ status }) {
  return <Badge status={status} />;
}