import { MapPin } from 'lucide-react'

interface Props {
  country: string
  province: string
  onCountryChange: (country: string) => void
  onProvinceChange: (province: string) => void
}

const LOCATIONS: Record<string, string[]> = {
  Canada: [
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Northwest Territories',
    'Nova Scotia',
    'Nunavut',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon',
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'Washington D.C.', 'West Virginia', 'Wisconsin', 'Wyoming',
  ],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  Australia: [
    'Australian Capital Territory',
    'New South Wales',
    'Northern Territory',
    'Queensland',
    'South Australia',
    'Tasmania',
    'Victoria',
    'Western Australia',
  ],
  Germany: [
    'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
    'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern',
    'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland',
    'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
  ],
  France: [
    'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne',
    'Centre-Val de Loire', 'Corse', 'Grand Est', 'Hauts-de-France',
    'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
    'Pays de la Loire', "Provence-Alpes-Côte d'Azur",
  ],
  Netherlands: [
    'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen',
    'Limburg', 'North Brabant', 'North Holland', 'Overijssel',
    'South Holland', 'Utrecht', 'Zeeland',
  ],
  India: [
    'Andhra Pradesh', 'Delhi', 'Gujarat', 'Haryana', 'Karnataka',
    'Kerala', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu',
    'Telangana', 'Uttar Pradesh', 'West Bengal',
  ],
  'New Zealand': ['Auckland', 'Bay of Plenty', 'Canterbury', 'Otago', 'Waikato', 'Wellington'],
  Ireland: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'],
  Singapore: [],
  Switzerland: ['Bern', 'Geneva', 'Zurich', 'Basel', 'Vaud'],
  Belgium: ['Brussels', 'Flanders', 'Wallonia'],
  Sweden: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala'],
  Spain: [
    'Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country',
    'Canary Islands', 'Cantabria', 'Castilla-La Mancha', 'Castile and León',
    'Catalonia', 'Community of Madrid', 'Extremadura', 'Galicia', 'La Rioja',
    'Murcia', 'Navarre', 'Valencian Community',
  ],
  'Saudi Arabia': [
    'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Eastern Province',
  ],
  UAE: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
  'South Africa': ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'],
  Brazil: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia'],
  Japan: ['Tokyo', 'Osaka', 'Kanagawa', 'Aichi', 'Fukuoka'],
}

export default function LocationSelector({
  country,
  province,
  onCountryChange,
  onProvinceChange,
}: Props) {
  const provinces = LOCATIONS[country] ?? []

  const handleCountryChange = (newCountry: string) => {
    onCountryChange(newCountry)
    onProvinceChange('')
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Where are you looking for jobs?</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
          <select
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a country…</option>
            {Object.keys(LOCATIONS).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {provinces.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Province / State / Region
            </label>
            <select
              value={province}
              onChange={(e) => onProvinceChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any region</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
