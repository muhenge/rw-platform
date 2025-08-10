export default function TeamList({ users }: { users: any[] }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Team Members</h2>
      {users.length === 0 ? (
        <div className="text-gray-500">No team members found.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                  {user.avatar}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{user.role}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
