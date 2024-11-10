import Vape3D from "./components/Vape3D";

const Page = () => {
  return (
    <div className="bg-gray-800 flex items-center justify-center">
      {/* A parte flex e justify-center vai centralizar o componente Vape3D na tela */}
      <Vape3D />
    </div>
  );
};

export default Page;
