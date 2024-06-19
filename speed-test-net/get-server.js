import speedTest from 'speedtest-net';

async function listServers() {
  try {
    const servers = await speedTest.fetchServers({ acceptLicense: true, acceptGdpr: true });
    console.log('Available servers:', servers);
  } catch (error) {
    console.error('Error fetching servers:', error);
  }
}

listServers();