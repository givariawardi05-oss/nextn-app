import PrintablePurchaseInvoice from './PrintablePurchaseInvoice';

const Page = () => {
  return <PrintablePurchaseInvoice />;
};

export async function generateStaticParams() {
  return [];
}

export default Page;