import pandas as pd
import censusdata

tables = {'B01003_001E' : 'population', "B02001_001E": "race_total", "B02001_003E": "black_total"}
columns = ['fips']
columns.extend(list(tables.values()))
# S1501_C02_015E for bachelors or higher percent?

def main():
  data = getAllCounties()
  processed_data = processData(data)

def getAllCounties():
  states = censusdata.geographies(censusdata.censusgeo([('state', '*')]), 'acs5', 2018)

  all_states = pd.DataFrame() 

  # For every state, get all counties
  for state in states:
    state_fips = states[state].geo[0][1]
    counties = censusdata.geographies(censusdata.censusgeo([('state', state_fips), ('county', '*')]), 'acs5', 2018)

    for county in counties:
      # Have to do it by county to preserve the fips code.
      # TODO: check if it's possible to avoid this.
      county_fips = counties[county].geo[1][1]

      data = censusdata.download('acs5', 2018,
             censusdata.censusgeo([('state', state_fips),
                                   ('county', county_fips)]),
            list(tables.keys()))

      data = data.reset_index()
      data['index'] = state_fips + county_fips

      all_states = pd.concat([all_states, data])
      # Temporary break so that we don't yet do this for all states
      break

  all_states.set_axis(columns, axis=1, inplace=True)
  return all_states

def processData(data):
  # TODO: process the data here
  return data

if __name__ == "__main__":
  main()