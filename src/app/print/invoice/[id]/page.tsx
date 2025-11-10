import PrintableInvoice from './PrintableInvoice';

const Page = () => {
  return <PrintableInvoice />;
};

export async function generateStaticParams() {
  return [];
}

export default Page;