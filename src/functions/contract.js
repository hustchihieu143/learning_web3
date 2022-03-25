import { Contract } from '@ethersproject/contracts';
import { SC_DD2, SC_MasterChef, SC_WETH } from 'utils/connect';
import ABI_DD2 from 'ABI/DD2';
import ABI_MasterChef from 'ABI/MasterChef';
import ABI_WETH from 'ABI/WETH';

export const getContractWETH = (library) => {
  return new Contract(
    SC_WETH,
    ABI_WETH,
    library.getSigner()
  );
}

export const getContractMasterChef = (library) => {
  return new Contract(
    SC_MasterChef,
    ABI_MasterChef,
    library.getSigner()
  );
}

export const getContractDD2 = (library) => {
  return new Contract(
    SC_DD2,
    ABI_DD2,
    library.getSigner()
  );
}