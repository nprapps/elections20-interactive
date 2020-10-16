import pandas as pd
import requests
import sys

# Pulls unemployment data from https://www.bls.gov/lau/#tables, which is a long page full of links.
# Need to pass in the most recent year as a param in the format of '19' for '2019' etc.
def get_unemployment_data(year):
    url = 'https://www.bls.gov/lau/laucnty' + year + '.xlsx'
    xlsx = pd.read_excel(url, usecols=[1,2,4,9])
    xlsx = xlsx.iloc[5:]
    xlsx.columns = ['state_fips', 'county_fips', 'year', 'unemployment']
    xlsx['key'] = xlsx['state_fips'] + xlsx['county_fips']
    xlsx['unemployment'] = xlsx['unemployment'].astype(float)/100
    xlsx = xlsx.drop(columns=['state_fips', 'county_fips'])

    xlsx.to_csv('data/unemployment_data.csv', index=False, encoding='utf-8',)

if __name__ == "__main__":
  get_unemployment_data(sys.argv[1])