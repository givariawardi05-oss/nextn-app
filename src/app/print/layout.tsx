import type {Metadata} from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Cetak Dokumen',
  description: 'Halaman Cetak Dokumen',
};

export default function PrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-body antialiased">
      {children}
    </div>
  );
}
