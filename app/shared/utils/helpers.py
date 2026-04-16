import datetime
from dateutil.relativedelta import relativedelta


def get_utcnow():
    """
    Returns the current datetime in UTC.
    """
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


def get_one_month_from_now():
    """
    Returns a datetime one month from now in UTC.
    """
    return get_utcnow() + relativedelta(months=1)
