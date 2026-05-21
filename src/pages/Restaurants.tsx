import { useEffect, useState } from 'react'
import { restaurants as restApi } from '../api/endpoints'
import type { Restaurant } from '../types'

export default function Restaurants() {
  const [restaurantList, setRestaurantList] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restApi.list()
      .then((res) => setRestaurantList(res.data.restaurants))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>

      {restaurantList.length === 0 ? (
        <p className="text-gray-500">No restaurants found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurantList.map((r) => (
            <div key={r.restaurant_id} className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900">{r.name}</h3>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>{r.address}</p>
                <p>{r.city}, {r.state} {r.zip_code}</p>
                <p>{r.phone}</p>
                <p className="text-xs text-gray-400 mt-2">Timezone: {r.timezone}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
