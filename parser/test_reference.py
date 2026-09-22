import unittest
from .json_output import format_data


class ReferenceTest(unittest.TestCase):
    def test_reference_is_preserved_as_text(self):
        record = dict(country='CAN', SailNo='CAN 52', GPH=600, OSN=600,
                      TN_Offshore_Low=1, TN_Offshore_Medium=1, TN_Offshore_High=1,
                      TN_Inshore_Low=1, TN_Inshore_Medium=1, TN_Inshore_High=1,
                      Builder='', Class='Test', Designer='', Age_Year=2000,
                      LOA=10, MB=3, Draft=2, Dspl_Measurement=4000, Area_Jib=20,
                      Area_Main=30, Area_Sym=0, CrewWT=400, WSS=20,
                      Allowances=dict(WindAngles=[], WindSpeeds=[], BeatAngle=[], Beat=[], GybeAngle=[], Run=[]))
        for source, expected in [(' 001ABC ', '001ABC'), ('', None), (None, None)]:
            with self.subTest(source=source):
                self.assertEqual(format_data({**record, 'RefNo': source})['reference'], expected)
        self.assertIsNone(format_data(record)['reference'])
