from appyter.fields import Field
from appyter.ext.json import try_json_loads

class MetabolomicsStudyField(Field):
  def __init__(self, **kwargs):
    super().__init__(**kwargs)

  @property
  def raw_value(self): return try_json_loads(self.args['value'])

  def constraint(self):
    return True
