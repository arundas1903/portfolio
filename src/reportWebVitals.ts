import { ReportHandler } from 'web-vitals';
import { trackWebVital } from './analytics/mixpanel';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }

  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    const send: ReportHandler = (metric) => {
      trackWebVital(metric.name, metric.value, metric.id);
    };
    getCLS(send);
    getFID(send);
    getFCP(send);
    getLCP(send);
    getTTFB(send);
  });
};

export default reportWebVitals;
