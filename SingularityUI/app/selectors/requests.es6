import { createSelector } from 'reselect';
import micromatch from 'micromatch';
import Utils from '../utils';

const getRequestsAPI = (state) => state.api.requests;
const getUserAPI = (state) => state.api.user;
const getRequests = (state) => state.requestsInState;
const getFilter = (state) => state.filter;

function findRequestIds(requests) {
  return _.map(requests, (r) => {
    return _.extend({}, r, {id: r.request ? r.request.id : r.requestId});
  });
}

export const getStarred = (state) => new Set(state.ui.starred);

export const getStarredRequests = createSelector(
  [getStarred, getRequestsAPI],
  (starredData, requestsAPI) => {
    const requests = findRequestIds(requestsAPI.data);
    return requests.filter((r) => starredData.has(r.request.id));
  }
);

export const getUserRequests = createSelector(
  [getUserAPI, getRequestsAPI],
  (userAPI, requestsAPI) => {
    const deployUserTrimmed = Utils.maybe(
      userAPI.data,
      ['user', 'email'],
      ''
    ).split('@')[0];

    const requests = findRequestIds(requestsAPI.data);

    return requests.filter((r) => {
      const activeDeployUser = Utils.maybe(
        r,
        ['requestDeployState', 'activeDeploy', 'user']
      );

      if (activeDeployUser) {
        const activeDeployUserTrimmed = activeDeployUser.split('@')[0];
        if (deployUserTrimmed === activeDeployUserTrimmed) {
          return true;
        }
      }

      const requestOwners = r.request.owners;
      if (requestOwners === undefined) {
        return false;
      }

      for (const owner of requestOwners) {
        if (deployUserTrimmed === owner.split('@')[0]) {
          return true;
        }
      }

      return false;
    });
  }
);


export const getUserRequestTotals = createSelector(
  [getUserRequests],
  (userRequests) => {
    const userRequestTotals = {
      total: userRequests.length,
      ON_DEMAND: 0,
      SCHEDULED: 0,
      WORKER: 0,
      RUN_ONCE: 0,
      SERVICE: 0
    };

    for (const r of userRequests) {
      userRequestTotals[r.request.requestType] += 1;
    }

    return userRequestTotals;
  }
);

export default createSelector([getRequests, getFilter], (requests, filter) => {
  let filteredRequests = requests;

  // Filter by state
  let stateFilter = null;
  switch (filter.state) {
    case 'activeDeploy':
      stateFilter = (request) => request.hasActiveDeploy;
      break;
    case 'noDeploy':
      stateFilter = (request) => !request.hasActiveDeploy;
      break;
    default:
      break;
  }
  if (stateFilter) {
    filteredRequests = _.filter(filteredRequests, stateFilter);
  }

  // Filter by request type
  if (!_.contains(['pending', 'cleanup'], filter.type)) {
    filteredRequests = _.filter(filteredRequests, (request) => request.request && _.contains(filter.subFilter, request.request.requestType));
  }

  // Filter by glob or string match
  if (filter.searchFilter) {
    const id = (request) => request.id || '';
    const user = (request) => `${request.hasActiveDeploy ? request.requestDeployState.activeDeploy.user : ''}`;

    if (Utils.isGlobFilter(filter.searchFilter)) {
      const res1 = _.filter(filteredRequests, (request) => {
        return micromatch.any(user(request).toLowerCase(), `*${filter.searchFilter.toLowerCase()}*`);
      });
      const res2 = _.filter(filteredRequests, (request) => {
        return micromatch.any(id(request).toLowerCase(), `*${filter.searchFilter.toLowerCase()}*`);
      });
      filteredRequests = _.sortBy(_.union(res1, res2), (request) => (micromatch.any(id(request).toLowerCase(), `${filter.searchFilter.toLowerCase()}*`) ? 1 : 0)).reverse();
    } else {
      const res1 = _.filter(filteredRequests, request => id(request).toLowerCase().indexOf(filter.searchFilter.toLowerCase()) > -1);
      const res2 = _.filter(filteredRequests, request => user(request).toLowerCase().indexOf(filter.searchFilter.toLowerCase()) > -1);
      filteredRequests = _.uniq(_.sortBy(_.union(res1, res2), (request) => (id(request).toLowerCase().startsWith(filter.searchFilter.toLowerCase()) ? 1 : 0)).reverse());
    }
  }

  return filteredRequests;
});
