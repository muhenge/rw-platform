export default function FilesList({ files }: { files: any[] }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Files</h2>
      {files.length === 0 ? (
        <div className="text-gray-500">No files found.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {files.map((file) => (
            <li key={file.id} className="py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{file.name}</div>
                <div className="text-sm text-gray-500">{file.size} • {file.date}</div>
              </div>
              <button className="ml-2 text-indigo-600 hover:underline">Download</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
