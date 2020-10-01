import pandas as pd
import censusdata
import requests

detail_tables = {'B01003_001E' : 'population', "B02001_001E": "race_total", "B02001_003E": "black_total", "B03002_001E": "race_hispanic_total", "B03002_003E": "white_alone", "B03002_012E" : "hispanic_total"}
subject_tables = {"S1501_C02_015E": "percent_bachelors", "S1901_C01_012E": "median_income"}

columns = ['fips']
columns.extend(list(detail_tables.values()) + list(subject_tables.values()))

def main():
  data = getAllCounties()
  processed_data = processData(data)

  processed_data.to_csv('data/census_data.csv', index=False)

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
      print('getting data for: ', state_fips, county_fips)

      detail_data = censusdata.download('acs5', 2018,
             censusdata.censusgeo([('state', state_fips),
                                   ('county', county_fips)]),
            list(detail_tables.keys())).reset_index()

      subject_data = censusdata.download('acs5', 2018,
             censusdata.censusgeo([('state', state_fips),
                                   ('county', county_fips)]),
            list(subject_tables.keys()), tabletype='subject').reset_index()

      data = detail_data.merge(subject_data)
      data['index'] = state_fips + county_fips

      all_states = pd.concat([all_states, data])

  all_states.set_axis(columns, axis=1, inplace=True)
  return all_states

def processData(data):
  # TODO: process the data here
  data['percent_black'] = data['black_total']/data['race_total']
  data['percent_white'] = data['white_alone'] / data['race_hispanic_total']
  data['percent_hispanic'] = data['hispanic_total'] / data['race_hispanic_total']
  return data

if __name__ == "__main__":
  main()