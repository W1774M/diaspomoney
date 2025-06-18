import DefaultTemplate from "@/template/DefaultTemplate";

const Page = () => {
  return (
    <DefaultTemplate>
      <div className="p-8">
        <h1 className="text-2xl text-center font-bold">About Page</h1>
        <p className="text-gray-500">About page content goes here.</p>
      </div>
    </DefaultTemplate>
  );
};

export default Page;
