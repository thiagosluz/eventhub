import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

async function getValidateData(hash: string) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const res = await fetch(`${backendUrl}/certificates/validate/${hash}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export default async function ValidateCertificatePage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const data = await getValidateData(hash);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificado Não Encontrado</h1>
          <p className="text-gray-600">
            Este certificado não existe ou o código de validação é inválido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full text-center">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificado Válido</h1>
        <p className="text-gray-600 mb-6">
          Este certificado foi autenticado com sucesso em nossa base de dados.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg text-left space-y-3">
          <div>
            <p className="text-sm text-gray-500">Participante</p>
            <p className="font-medium text-gray-900">{data.participantName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Evento</p>
            <p className="font-medium text-gray-900">{data.eventName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Data de Emissão</p>
            <p className="font-medium text-gray-900">
              {new Date(data.issuedAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Código Hash</p>
            <p className="font-mono text-xs text-gray-900 break-all">{data.hash}</p>
          </div>
        </div>

        <a
          href={data.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Visualizar Certificado Original
        </a>
      </div>
    </div>
  );
}
