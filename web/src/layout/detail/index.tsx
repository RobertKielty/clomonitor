import classNames from 'classnames';
import { isNull, isUndefined } from 'lodash';
import moment from 'moment';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { GoCalendar } from 'react-icons/go';
import { IoIosArrowBack } from 'react-icons/io';
import { IoBarChart } from 'react-icons/io5';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import API from '../../api';
import useScrollRestorationFix from '../../hooks/useScrollRestorationFix';
import { ProjectDetail } from '../../types';
import scrollToTop from '../../utils/scrollToTop';
import updateMetaIndex from '../../utils/updateMetaIndex';
import CartegoryBadge from '../common/badges/CategoryBadge';
import FoundationBadge from '../common/badges/FoundationBadge';
import MaturityBadge from '../common/badges/MaturityBadge';
import CategoriesSummary from '../common/CategoriesSummary';
import ExternalLink from '../common/ExternalLink';
import Image from '../common/Image';
import Loading from '../common/Loading';
import NoData from '../common/NoData';
import ProjectDropdown from '../common/ProjectDropdown';
import RoundScore from '../common/RoundScore';
import Timeline from '../common/timeline/Timeline';
import SubNavbar from '../navigation/SubNavbar';
import RepositorySection from '../search/RepositorySection';
import WebsiteSection from '../search/WebsiteSection';
import styles from './Detail.module.css';
import RepositoriesList from './repositories';

interface Props {
  setInvisibleFooter: Dispatch<SetStateAction<boolean>>;
}

const Detail = (props: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentState = location.state as { currentSearch?: string };
  const { project, foundation } = useParams();
  const [detail, setDetail] = useState<ProjectDetail | null | undefined>();
  const [isLoadingProject, setIsLoadingProject] = useState<boolean>(false);
  const [activeDate, setActiveDate] = useState<string | undefined>();
  const [snapshots, setSnapshots] = useState<string[]>([]);

  useScrollRestorationFix();

  useEffect(() => {
    if (location.hash === '') {
      scrollToTop();
    } else {
      scrollIntoView();
    }
  }, [location]); /* eslint-disable-line react-hooks/exhaustive-deps */

  const scrollIntoView = useCallback(
    (id?: string) => {
      const elId = id || location.hash;
      if (isUndefined(elId) || elId === '') return;
      try {
        const element = document.getElementById(elId.replace('#', ''));
        if (element) {
          element.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
        }
      } finally {
        return;
      }
    },
    [location.hash]
  );

  async function trackView(projectID: string) {
    try {
      API.trackView(projectID);
    } catch {
      // Do not do anything
    }
  }

  async function fetchProjectDetail() {
    scrollToTop(); // Go to top when a new project is fetched
    setIsLoadingProject(true);
    props.setInvisibleFooter(true);
    try {
      const projectDetail = await API.getProjectDetail(project!, foundation!);
      trackView(projectDetail.id);
      setDetail(projectDetail);
      setSnapshots(projectDetail.snapshots || []);
      updateMetaIndex(projectDetail.display_name || projectDetail.name, projectDetail.description);
      setIsLoadingProject(false);
      props.setInvisibleFooter(false);
    } catch (err: any) {
      setDetail(null);
      setIsLoadingProject(false);
      props.setInvisibleFooter(false);
    }
  }

  useEffect(() => {
    if (detail) {
      if (!isUndefined(activeDate)) {
        setActiveDate(undefined);
      } else {
        fetchProjectDetail();
      }
    } else {
      if (!isUndefined(project)) {
        fetchProjectDetail();
      }
    }
  }, [project, foundation]); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    async function fetchSnapshot() {
      setIsLoadingProject(true);
      try {
        const projectDetail = await API.getProjectSnapshot(project!, foundation!, activeDate!);
        setDetail(projectDetail);
        setIsLoadingProject(false);
        props.setInvisibleFooter(false);
      } catch (err: any) {
        setDetail(null);
        setIsLoadingProject(false);
        props.setInvisibleFooter(false);
      }
    }

    if (detail) {
      if (isUndefined(activeDate)) {
        fetchProjectDetail();
      } else {
        fetchSnapshot();
      }
    }
  }, [activeDate]); /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <>
      {currentState && currentState.currentSearch && (
        <SubNavbar>
          <button
            onClick={() => navigate(`/search${currentState.currentSearch}`)}
            className={`btn btn-link p-0 text-reset ${styles.backBtn}`}
            aria-label="Back to results"
          >
            <div className="d-flex flex-row align-items-center">
              <IoIosArrowBack className="me-2" />
              <div>Back to results</div>
            </div>
          </button>
        </SubNavbar>
      )}

      <main className="container-lg flex-grow-1 mb-0 mb-md-4">
        {isLoadingProject && (
          <Loading
            className={classNames(styles.loading, {
              [styles.loadingWithBackBar]: currentState && currentState.currentSearch,
            })}
            transparentBg
          />
        )}

        {!isUndefined(detail) && (
          <div
            className={classNames({
              'opacity-75': isLoadingProject,
            })}
          >
            {isNull(detail) ? (
              <div className="pt-5">
                <NoData className={styles.extraMarginB}>
                  <div className="mb-4 mb-lg-5 h2">The requested project was not found.</div>
                  <p className="h5 mb-0">The project you are looking for may have been deleted.</p>
                </NoData>
              </div>
            ) : (
              <div className="d-flex flex-row">
                <div className={`flex-grow-1 ${styles.contentWrapper}`}>
                  <div className="my-4 my-md-5">
                    <div className="border">
                      <div className="px-0 px-md-4 pt-0 pt-md-4">
                        <div className={`d-flex flex-row align-items-stretch px-3 py-2 p-md-0 ${styles.titleWrapper}`}>
                          <div
                            className={`d-flex align-items-center justify-content-center my-auto ${styles.imageWrapper}`}
                          >
                            <Image
                              alt={`${detail.display_name || detail.name} logo`}
                              url={detail.logo_url}
                              dark_url={detail.logo_dark_url}
                            />
                          </div>
                          <div className="d-flex flex-column justify-content-between ms-3 ms-sm-4 truncateWrapper">
                            <div className={`text-truncate fw-bold mb-0 ${styles.title}`}>
                              {detail.display_name || detail.name}
                            </div>

                            <div className="d-flex flex-row align-items-center my-2">
                              <FoundationBadge foundation={detail.foundation} />
                              <MaturityBadge maturityLevel={detail.maturity} className="d-none d-md-block ms-2" />
                              <CartegoryBadge category={detail.category} className="d-none d-md-block ms-2" />
                            </div>

                            <div className={`d-none d-sm-flex flex-row align-items-center ${styles.info}`}>
                              <RepositorySection repositories={detail.repositories} />

                              <WebsiteSection repositories={detail.repositories} />

                              {detail.devstats_url && (
                                <>
                                  <ExternalLink href={detail.devstats_url} className="ms-3">
                                    <div className={`d-flex flex-row align-items-center ${styles.link}`}>
                                      <IoBarChart className={`me-1 ${styles.statsIcon}`} />
                                      <div>DevStats</div>
                                    </div>
                                  </ExternalLink>
                                </>
                              )}

                              {!isUndefined(detail.accepted_at) && (
                                <div className={`d-flex flex-row align-items-center ms-3 ${styles.subtitle}`}>
                                  <GoCalendar className={`me-1 ${styles.statsIcon}`} />
                                  <div className="d-flex flex-row">
                                    <span className="text-muted d-none d-lg-block me-1">Accepted:</span>
                                    <span className="d-none d-md-block">
                                      {moment.unix(detail.accepted_at!).format('Do MMMM YYYY')}
                                    </span>
                                    <span className="d-block d-md-none">
                                      {moment.unix(detail.accepted_at!).format('YYYY')}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {isUndefined(activeDate) && (
                            <div className="d-none d-md-block ms-auto">
                              <div className="h-100 position-relative d-flex flex-column justify-content-between align-items-end">
                                <ProjectDropdown
                                  foundation={detail.foundation}
                                  projectName={detail.name}
                                  projectDisplayName={detail.display_name}
                                />
                              </div>
                            </div>
                          )}
                          <div className="d-flex d-md-none align-items-center ms-auto">
                            <RoundScore score={detail.score.global!} className={`ms-2 ${styles.global}`} />
                          </div>
                        </div>
                        <p className={`text-muted mt-3 mb-2 mt-md-4 mb-md-3 mx-3 mx-md-0 ${styles.description}`}>
                          {detail.description}
                        </p>
                        <div className={`text-muted fst-italic mx-3 mx-md-0 mb-2 mb-md-3 ${styles.updated}`}>
                          {isUndefined(activeDate) ? (
                            <>Updated {moment.unix(detail.updated_at).fromNow()}</>
                          ) : (
                            <>
                              This is a snapshot of the project taken on{' '}
                              <span className="fw-bold">{moment(activeDate, 'YYYY-MM-DD').format("Do MMM 'YY")}</span>.
                            </>
                          )}
                        </div>
                      </div>
                      <div className="pt-2">
                        <CategoriesSummary
                          score={detail.score}
                          repoName={detail.repositories.length === 1 ? detail.repositories[0].name : undefined}
                          scrollIntoView={scrollIntoView}
                          bigSize
                          withLinks
                        />
                      </div>
                    </div>
                  </div>

                  <RepositoriesList
                    isSnapshotVisible={!isUndefined(activeDate)}
                    repositories={detail.repositories}
                    scrollIntoView={scrollIntoView}
                  />
                </div>

                <Timeline
                  snapshots={snapshots}
                  className="my-4 my-md-5 ms-4 ms-md-5"
                  activeDate={activeDate}
                  setActiveDate={setActiveDate}
                  currentSearch={currentState ? currentState.currentSearch : undefined}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default Detail;
